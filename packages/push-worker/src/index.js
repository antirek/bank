import amqp from 'amqplib';
import webpush from 'web-push';
import { config } from '@boqq/shared/config';
import { ready, Dialog, User, PushSubscription } from '@boqq/shared/models';

const LOG = '[push-worker]';

/** Логировать каждое Rabbit-сообщение (eventType / причина пропуска) — шумно при bind=# */
const LOG_ALL_AMQP = String(process.env.PUSH_WORKER_LOG_ALL_AMQP || '').trim() === '1';

function redactAmqpUrl(url) {
  return String(url || '').replace(/^(amqps?:\/\/)([^:/?#]+):([^@]*)@/i, '$1$2:***@');
}

function keyPreview(key) {
  if (!key || typeof key !== 'string') return '(none)';
  const k = key.trim();
  return k.length <= 16 ? `${k.slice(0, 8)}…` : `${k.slice(0, 8)}…${k.slice(-6)}(len=${k.length})`;
}

function endpointPreview(endpoint) {
  if (!endpoint) return '';
  return endpoint.length <= 64 ? endpoint : `${endpoint.slice(0, 64)}…`;
}

function parseMessageCreatePayload(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const eventType = raw.eventType ?? raw.type ?? raw.event;
  if (eventType !== 'message.create') return null;
  const mms3DialogId = raw.data?.dialog?.dialogId ?? raw.dialog?.dialogId ?? raw.dialogId;
  const rawMessage = raw.data?.message ?? raw.message;
  if (!mms3DialogId || !rawMessage?.messageId) return null;
  return { mms3DialogId, rawMessage };
}

function ownerMms3Id(ownerUser, ownerBoqqId) {
  return ownerUser?.mms3UserId || String(ownerBoqqId).replace(/\./g, '_');
}

function buildDeepLink(dialog) {
  const base = config.ownerPwaPublicUrl;
  if (!base) return null;
  try {
    const u = new URL(base.replace(/\/+$/, ''));
    u.searchParams.set('business', dialog.businessId);
    u.searchParams.set('dialog', dialog.dialogId);
    return u.href;
  } catch {
    return null;
  }
}

function toWebPushSubscription(doc) {
  return {
    endpoint: doc.endpoint,
    keys: { p256dh: doc.p256dh, auth: doc.auth }
  };
}

async function sendPushToOwner(dialog, url) {
  const subs = await PushSubscription.find({
    userId: dialog.ownerId,
    client: 'owner-pwa'
  });
  if (!subs.length) {
    console.info(
      `${LOG} message.create skip: no PushSubscription docs ownerId=${dialog.ownerId} dialogId=${dialog.dialogId}`
    );
    return;
  }

  console.info(
    `${LOG} message.create push ownerId=${dialog.ownerId} dialogId=${dialog.dialogId} businessId=${dialog.businessId} subs=${subs.length} url=${url}`
  );

  const payload = JSON.stringify({
    title: 'Boqq',
    body: 'Новое сообщение в чате',
    url: url || '/'
  });

  for (const doc of subs) {
    const sub = toWebPushSubscription(doc);
    try {
      await webpush.sendNotification(sub, payload, {
        TTL: 60 * 60,
        urgency: 'normal'
      });
      console.info(`${LOG} webpush ok endpoint=${endpointPreview(doc.endpoint)}`);
    } catch (err) {
      const code = err?.statusCode;
      if (code === 410 || code === 404) {
        await PushSubscription.deleteOne({ _id: doc._id });
        console.warn(`${LOG} webpush dead subscription removed (${code}) endpoint=${endpointPreview(doc.endpoint)}`);
      } else {
        console.error(
          `${LOG} webpush error status=${code || 'n/a'} msg=${err?.message || err} endpoint=${endpointPreview(doc.endpoint)}`
        );
      }
    }
  }
}

function amqpSkipReason(raw, parsed) {
  if (!raw || typeof raw !== 'object') return 'not an object';
  const eventType = raw.eventType ?? raw.type ?? raw.event ?? '(missing)';
  if (parsed === null && (raw.eventType ?? raw.type ?? raw.event) === 'message.create') {
    return 'message.create but missing dialogId or message.messageId';
  }
  if (eventType !== 'message.create') return `eventType=${eventType}`;
  return 'unparsed';
}

async function handleAmqpMessage(contentBuf) {
  let raw;
  try {
    raw = JSON.parse(contentBuf.toString());
  } catch (e) {
    console.warn(`${LOG} skip: invalid JSON (${e?.message || 'parse error'})`);
    return;
  }

  const parsed = parseMessageCreatePayload(raw);
  if (!parsed) {
    if (LOG_ALL_AMQP) {
      console.info(`${LOG} rabbit msg skip: ${amqpSkipReason(raw, parsed)}`);
    }
    return;
  }

  const { mms3DialogId, rawMessage } = parsed;
  console.info(
    `${LOG} message.create mms3DialogId=${mms3DialogId} messageId=${rawMessage.messageId} senderId=${rawMessage.senderId ?? '(none)'}`
  );

  const dialog = await Dialog.findOne({ mms3DialogId, isActive: true });
  if (!dialog) {
    console.info(`${LOG} message.create skip: no Dialog for mms3DialogId=${mms3DialogId}`);
    return;
  }

  const ownerUser = await User.findOne({ userId: dialog.ownerId });
  const ownerSid = ownerMms3Id(ownerUser, dialog.ownerId);
  if (rawMessage.senderId === ownerSid) {
    console.info(`${LOG} message.create skip: from owner (no push) ownerId=${dialog.ownerId}`);
    return;
  }

  const url = buildDeepLink(dialog);
  if (!url) {
    console.warn(`${LOG} message.create skip: OWNER_PUBLIC_URL unset — no deep link`);
    return;
  }
  await sendPushToOwner(dialog, url);
}

async function main() {
  const { vapidPublicKey, vapidPrivateKey, vapidSubject, rabbitmqAmqp } = config;

  console.info(`${LOG} starting…`);
  console.info(`${LOG} VAPID subject=${vapidSubject} publicKey=${keyPreview(vapidPublicKey)} privateKey=${keyPreview(vapidPrivateKey)}`);
  console.info(`${LOG} OWNER_PUBLIC_URL=${config.ownerPwaPublicUrl || '(empty — pushes skipped)'}`);
  console.info(
    `${LOG} Rabbit: ${redactAmqpUrl(rabbitmqAmqp)} exchange=${config.rabbitmqEventsExchange} type=${config.rabbitmqEventsExchangeType} queue=${config.rabbitmqEventsQueue} bind=${config.rabbitmqEventsBindingKey || '#'}`
  );
  if (LOG_ALL_AMQP) {
    console.info(`${LOG} PUSH_WORKER_LOG_ALL_AMQP=1 — логируются все входящие JSON (кроме невалидных)`);
  }

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.error(`${LOG} fatal: set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY`);
    process.exit(1);
  }
  if (!config.ownerPwaPublicUrl) {
    console.warn(`${LOG} OWNER_PUBLIC_URL empty — message.create will be skipped at send stage`);
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  await ready;
  console.info(`${LOG} mongoose ready`);

  console.info(`${LOG} connecting AMQP…`);
  const conn = await amqp.connect(rabbitmqAmqp);
  console.info(`${LOG} AMQP connected`);

  conn.on('error', (err) => console.error(`${LOG} AMQP connection error`, err));
  conn.on('close', () => {
    console.error(`${LOG} AMQP connection closed — process exit 1`);
    process.exit(1);
  });

  const ch = await conn.createChannel();
  const ex = config.rabbitmqEventsExchange;
  const exType = config.rabbitmqEventsExchangeType || 'topic';
  const qName = config.rabbitmqEventsQueue;
  const bindingKey = exType === 'fanout' ? '' : config.rabbitmqEventsBindingKey || '#';

  await ch.assertExchange(ex, exType, { durable: true });
  await ch.assertQueue(qName, { durable: true });
  await ch.bindQueue(qName, ex, bindingKey);
  await ch.prefetch(10);

  console.info(
    `${LOG} consuming queue=${qName} exchange=${ex} type=${exType} bind=${bindingKey || '(fanout)'} — waiting for messages`
  );

  await ch.consume(qName, async (msg) => {
    if (!msg) return;
    try {
      await handleAmqpMessage(msg.content);
      ch.ack(msg);
    } catch (e) {
      console.error(`${LOG} handler error (message nack, no requeue)`, e);
      ch.nack(msg, false, false);
    }
  });
}

process.on('SIGTERM', () => console.info(`${LOG} SIGTERM`));
process.on('SIGINT', () => console.info(`${LOG} SIGINT`));
process.on('unhandledRejection', (r) => console.error(`${LOG} unhandledRejection`, r));
process.on('uncaughtException', (e) => console.error(`${LOG} uncaughtException`, e));

main().catch((e) => {
  console.error(`${LOG} fatal`, e);
  process.exit(1);
});
