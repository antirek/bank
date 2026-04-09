/* eslint-disable no-undef */
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

try {
  const handler = createHandlerBoundToURL('index.html');
  registerRoute(
    new NavigationRoute(handler, {
      denylist: [/^\/api\//, /^\/runtime-config\.json$/]
    })
  );
} catch (e) {
  console.warn('[sw] NavigationRoute', e);
}

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = typeof data.title === 'string' ? data.title : 'Boqq';
  const body = typeof data.body === 'string' ? data.body : 'Новое сообщение в чате';
  const url = typeof data.url === 'string' ? data.url : '/';
  const iconUrl = new URL('pwa-192.png', self.registration.scope).href;
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      data: { url },
      icon: iconUrl,
      badge: iconUrl
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          if ('navigate' in client && typeof client.navigate === 'function') {
            return client.navigate(url).then(() => client.focus());
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
      return undefined;
    })
  );
});
