import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@boqq/api-client';
import { ownerAppConfig } from '@/config.js';

const LOG = '[owner-pwa push]';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const usePushNotificationsStore = defineStore('pushNotifications', () => {
  const busy = ref(false);
  const lastError = ref('');

  const supported = computed(
    () =>
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
  );

  const vapidReady = computed(() => !!ownerAppConfig.vapidPublicKey);

  async function postSubscription(sub) {
    const json = sub.toJSON ? sub.toJSON() : sub;
    const base = api.defaults.baseURL || '';
    const ep = typeof json?.endpoint === 'string' ? json.endpoint : '';
    console.info(`${LOG} POST /me/push-subscriptions`, {
      baseURL: base,
      endpointPreview: ep ? `${ep.slice(0, 72)}${ep.length > 72 ? '…' : ''}` : '(none)'
    });
    try {
      const res = await api.post('/me/push-subscriptions', {
        client: 'owner-pwa',
        subscription: json
      });
      console.info(`${LOG} POST ok`, res.status);
    } catch (e) {
      console.error(
        `${LOG} POST failed`,
        e?.response?.status,
        e?.response?.data,
        e?.message || e
      );
      throw e;
    }
  }

  /** Если разрешение уже есть и есть подписка — обновить запись на сервере. */
  async function syncIfSubscribed() {
    if (!supported.value) {
      console.info(`${LOG} sync skip: API unsupported in this browser`);
      return;
    }
    if (!vapidReady.value) {
      console.info(`${LOG} sync skip: no vapidPublicKey (owner-api VAPID_PUBLIC_KEY /runtime-config.json)`);
      return;
    }
    if (Notification.permission !== 'granted') {
      console.info(`${LOG} sync skip: Notification.permission=${Notification.permission}`);
      return;
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) {
        console.info(`${LOG} sync skip: no browser PushSubscription (нажмите «Включить push»)`);
        return;
      }
      await postSubscription(sub);
    } catch (e) {
      console.warn(`${LOG} syncIfSubscribed error`, e);
    }
  }

  async function enable() {
    lastError.value = '';
    if (!supported.value) {
      console.info(`${LOG} enable abort: unsupported`);
      lastError.value = 'Браузер не поддерживает push';
      return false;
    }
    if (!vapidReady.value) {
      console.info(`${LOG} enable abort: no vapidPublicKey`);
      lastError.value = 'На сервере не задан VAPID_PUBLIC_KEY';
      return false;
    }
    busy.value = true;
    try {
      console.info(`${LOG} enable: request Notification permission…`);
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        console.info(`${LOG} enable abort: permission=${perm}`);
        lastError.value = 'Разрешение на уведомления не выдано';
        return false;
      }
      const reg = await navigator.serviceWorker.ready;
      const key = urlBase64ToUint8Array(ownerAppConfig.vapidPublicKey);
      console.info(`${LOG} enable: pushManager.subscribe…`);
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key
      });
      await postSubscription(sub);
      return true;
    } catch (e) {
      lastError.value = e?.response?.data?.error || e?.message || 'Ошибка подписки';
      console.error('[push] enable', e);
      return false;
    } finally {
      busy.value = false;
    }
  }

  async function revoke() {
    lastError.value = '';
    if (!supported.value) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        try {
          console.info(`${LOG} DELETE /me/push-subscriptions`, {
            baseURL: api.defaults.baseURL || '',
            endpointPreview: sub.endpoint.slice(0, 72)
          });
          await api.delete('/me/push-subscriptions', { data: { endpoint: sub.endpoint } });
          console.info(`${LOG} DELETE ok`);
        } catch (e) {
          console.warn(`${LOG} DELETE failed (продолжаем local unsubscribe)`, e?.response?.status, e?.message);
          /* сеть / 404 — всё равно отписываемся локально */
        }
        await sub.unsubscribe();
      }
    } catch (e) {
      console.warn('[push] revoke', e);
    }
  }

  return {
    busy,
    lastError,
    supported,
    vapidReady,
    enable,
    revoke,
    syncIfSubscribed
  };
});
