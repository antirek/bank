import http from 'http';
import { WebSocketServer } from 'ws';
import amqp from 'amqplib';
import { config } from '@boqq/shared/config';
import { ready, User, Dialog } from '@boqq/shared/models';
import { verifyToken } from './auth.js';
import { normalizeMessageCreate } from './normalizeMessage.js';

const PORT = config.apps.wsServer.port;
const EXCHANGE = 'chat3_updates';

let amqpConnection = null;

function escapeRoutingSegment(id) {
  return String(id).replace(/[*#\\]/g, '');
}

async function getAmqpConnection() {
  if (!config.rabbitmqAmqp) return null;
  if (!amqpConnection) {
    amqpConnection = await amqp.connect(config.rabbitmqAmqp);
    amqpConnection.on('error', (err) => {
      console.error('[ws-server] AMQP connection error', err);
      amqpConnection = null;
    });
    amqpConnection.on('close', () => {
      amqpConnection = null;
    });
  }
  return amqpConnection;
}

/**
 * @param {import('ws').WebSocket} ws
 * @param {string} boqqUserId
 */
async function attachRabbitConsumer(ws, boqqUserId) {
  const user = await User.findOne({ userId: boqqUserId });
  const mms3UserId =
    user?.mms3UserId || boqqUserId.replace(/\./g, '_');

  const conn = await getAmqpConnection();
  if (!conn) {
    ws.send(
      JSON.stringify({
        type: 'error',
        code: 'rabbit_unconfigured',
        message: 'RABBITMQ_AMQP is not set'
      })
    );
    ws.close();
    return;
  }

  const ch = await conn.createChannel();
  let consumerTag = null;

  const cleanup = async () => {
    try {
      if (consumerTag) await ch.cancel(consumerTag);
    } catch (_) {
      /* ignore */
    }
    try {
      await ch.close();
    } catch (_) {
      /* ignore */
    }
  };

  ws.once('close', cleanup);

  const { queue } = await ch.assertQueue('', {
    exclusive: true,
    autoDelete: true
  });

  const routingPattern = `update.*.user.${escapeRoutingSegment(mms3UserId)}.*`;
  await ch.bindQueue(queue, EXCHANGE, routingPattern);

  const { consumerTag: tag } = await ch.consume(
    queue,
    async (msg) => {
      if (!msg) return;
      try {
        const update = JSON.parse(msg.content.toString());
        if (update.eventType !== 'message.create') {
          ch.ack(msg);
          return;
        }

        const mms3DialogId = update.data?.dialog?.dialogId;
        const rawMessage = update.data?.message;
        if (!mms3DialogId || !rawMessage?.messageId) {
          ch.ack(msg);
          return;
        }

        const dialog = await Dialog.findOne({
          mms3DialogId,
          isActive: true,
          $or: [{ userId: boqqUserId }, { ownerId: boqqUserId }]
        });

        if (!dialog) {
          ch.ack(msg);
          return;
        }

        const payload = await normalizeMessageCreate(rawMessage, boqqUserId);

        if (ws.readyState === 1) {
          ws.send(
            JSON.stringify({
              type: 'message.new',
              dialogId: dialog.dialogId,
              message: payload
            })
          );
        }
        ch.ack(msg);
      } catch (e) {
        console.error('[ws-server] consume error', e);
        try {
          ch.nack(msg, false, false);
        } catch (_) {
          /* ignore */
        }
      }
    },
    { noAck: false }
  );

  consumerTag = tag;
}

const server = http.createServer((req, res) => {
  if (req.url?.startsWith('/health')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        ok: true,
        rabbitConfigured: Boolean(config.rabbitmqAmqp)
      })
    );
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  try {
    const host = req.headers.host || 'localhost';
    const url = new URL(req.url || '/', `http://${host}`);
    if (url.pathname !== '/ws') {
      socket.destroy();
      return;
    }
    const token = url.searchParams.get('token');
    const decoded = token ? verifyToken(token) : null;
    if (!decoded?.userId) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, decoded.userId);
    });
  } catch (e) {
    console.error('[ws-server] upgrade error', e);
    socket.destroy();
  }
});

wss.on('connection', (ws, boqqUserId) => {
  (async () => {
    try {
      await attachRabbitConsumer(ws, boqqUserId);
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'ready' }));
      }
    } catch (e) {
      console.error('[ws-server] subscribe failed', e);
      try {
        ws.send(
          JSON.stringify({
            type: 'error',
            code: 'subscribe_failed',
            message: e?.message || String(e)
          })
        );
      } catch (_) {
        /* ignore */
      }
      ws.close();
    }
  })();
});

async function start() {
  await ready;
  server.listen(PORT, () => {
    console.log(`[ws-server] http://127.0.0.1:${PORT}  (WS path /ws)`);
    if (!config.rabbitmqAmqp) {
      console.warn(
        '[ws-server] RABBITMQ_AMQP is empty — WebSocket clients will get rabbit_unconfigured'
      );
    }
  });
}

start().catch((e) => {
  console.error('[ws-server] failed to start', e);
  process.exit(1);
});
