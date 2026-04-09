import { PushSubscription } from '@boqq/shared/models';

const LOG = '[push-subscriptions]';

const ALLOWED_CLIENTS = new Set(['owner-pwa']);

function endpointLogPreview(endpoint) {
  if (!endpoint) return '(empty)';
  const max = 72;
  return endpoint.length <= max ? endpoint : `${endpoint.slice(0, max)}…(len=${endpoint.length})`;
}

function validateSubscriptionBody(body) {
  const sub = body?.subscription;
  if (!sub || typeof sub !== 'object') {
    return { error: 'subscription object required' };
  }
  const endpoint = typeof sub.endpoint === 'string' ? sub.endpoint.trim() : '';
  const keys = sub.keys;
  const p256dh = keys && typeof keys.p256dh === 'string' ? keys.p256dh.trim() : '';
  const auth = keys && typeof keys.auth === 'string' ? keys.auth.trim() : '';
  if (!endpoint || !p256dh || !auth) {
    return { error: 'subscription.endpoint and subscription.keys.p256dh, keys.auth required' };
  }
  const client = typeof body.client === 'string' ? body.client.trim() : 'owner-pwa';
  if (!ALLOWED_CLIENTS.has(client)) {
    return { error: 'unsupported client' };
  }
  return { endpoint, p256dh, auth, client };
}

export const registerPushSubscription = async (req, res) => {
  const ip = req.ip || req.socket?.remoteAddress || '';
  try {
    const userId = req.user?.userId;
    if (!userId) {
      console.warn(`${LOG} POST register 401 ip=${ip} — no JWT user`);
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const parsed = validateSubscriptionBody(req.body);
    if (parsed.error) {
      console.warn(`${LOG} POST register 400 userId=${userId} ip=${ip} — ${parsed.error}`);
      return res.status(400).json({ error: parsed.error });
    }
    const { endpoint, p256dh, auth, client } = parsed;
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : '';

    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { userId, client, endpoint, p256dh, auth, userAgent },
      { upsert: true, new: true }
    );

    console.log(
      `${LOG} POST register 201 userId=${userId} client=${client} ip=${ip} endpoint=${endpointLogPreview(endpoint)}`
    );
    return res.status(201).json({ data: { ok: true } });
  } catch (e) {
    console.error(`${LOG} POST register 500`, e);
    return res.status(500).json({ error: e.message || 'Internal error' });
  }
};

export const revokePushSubscription = async (req, res) => {
  const ip = req.ip || req.socket?.remoteAddress || '';
  try {
    const userId = req.user?.userId;
    if (!userId) {
      console.warn(`${LOG} DELETE revoke 401 ip=${ip} — no JWT user`);
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const endpoint = typeof req.body?.endpoint === 'string' ? req.body.endpoint.trim() : '';
    if (!endpoint) {
      console.warn(`${LOG} DELETE revoke 400 userId=${userId} ip=${ip} — endpoint required`);
      return res.status(400).json({ error: 'endpoint required' });
    }
    const r = await PushSubscription.deleteOne({ userId, endpoint });
    if (r.deletedCount === 0) {
      console.warn(
        `${LOG} DELETE revoke 404 userId=${userId} ip=${ip} endpoint=${endpointLogPreview(endpoint)}`
      );
      return res.status(404).json({ error: 'Subscription not found' });
    }
    console.log(
      `${LOG} DELETE revoke 204 userId=${userId} ip=${ip} endpoint=${endpointLogPreview(endpoint)}`
    );
    return res.status(204).end();
  } catch (e) {
    console.error(`${LOG} DELETE revoke 500`, e);
    return res.status(500).json({ error: e.message || 'Internal error' });
  }
};
