import amqp from 'amqplib';
import webpush from 'web-push';
import { config } from '@boqq/shared/config';
import { ready, Dialog, User, PushSubscription } from '@boqq/shared/models';

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
  if (!subs.length) return;

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
    } catch (err) {
      const code = err?.statusCode;
      if (code === 410 || code === 404) {
        await PushSubscription.deleteOne({ _id: doc._id });
        console.warn('[push-worker] removed dead subscription', doc.endpoint.slice(0, 48));
      } else {
        console.error('[push-worker] sendNotification', code || err?.message, doc.endpoint.slice(0, 48));
      }
    }
  }
}

async function handleAmqpMessage(contentBuf) {
  let raw;
  try {
    raw = JSON.parse(contentBuf.toString());
  } catch {
    return;
  }
  const parsed = parseMessageCreatePayload(raw);
  if (!parsed) return;

  const { mms3DialogId, rawMessage } = parsed;
  const dialog = await Dialog.findOne({ mms3DialogId, isActive: true });
  if (!dialog) return;

  const ownerUser = await User.findOne({ userId: dialog.ownerId });
  const ownerSid = ownerMms3Id(ownerUser, dialog.ownerId);
  if (rawMessage.senderId === ownerSid) return;

  const url = buildDeepLink(dialog);
  if (!url) {
    console.warn('[push-worker] OWNER_PUBLIC_URL not set — skip push (no deep link)');
    return;
  }
  await sendPushToOwner(dialog, url);
}

async function main() {
  const { vapidPublicKey, vapidPrivateKey, vapidSubject, rabbitmqAmqp } = config;

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.error('[push-worker] Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY');
    process.exit(1);
  }
  if (!config.ownerPwaPublicUrl) {
    console.warn('[push-worker] OWNER_PUBLIC_URL empty — pushes will be skipped until set');
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  await ready;

  const conn = await amqp.connect(rabbitmqAmqp);
  conn.on('error', (err) => console.error('[push-worker] AMQP connection error', err));
  conn.on('close', () => process.exit(1));

  const ch = await conn.createChannel();
  const ex = config.rabbitmqEventsExchange;
  const exType = config.rabbitmqEventsExchangeType || 'topic';
  const qName = config.rabbitmqEventsQueue;
  const bindingKey = exType === 'fanout' ? '' : config.rabbitmqEventsBindingKey || '#';

  await ch.assertExchange(ex, exType, { durable: true });
  await ch.assertQueue(qName, { durable: true });
  await ch.bindQueue(qName, ex, bindingKey);
  await ch.prefetch(10);

  console.log(
    `[push-worker] queue=${qName} exchange=${ex} type=${exType} bind=${bindingKey || '(fanout)'}`
  );

  await ch.consume(qName, async (msg) => {
    if (!msg) return;
    try {
      await handleAmqpMessage(msg.content);
      ch.ack(msg);
    } catch (e) {
      console.error('[push-worker] handler error', e);
      ch.nack(msg, false, false);
    }
  });
}

main().catch((e) => {
  console.error('[push-worker] fatal', e);
  process.exit(1);
});
