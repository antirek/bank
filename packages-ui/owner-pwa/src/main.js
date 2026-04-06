import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import {
  assertOwnerAppConfig,
  loadOwnerRuntimeConfig,
  ownerAppConfig
} from './config.js';
import { useAuthStore } from './stores/auth';
import api, { setAuthTokenGetter } from '@boqq/api-client';

async function bootstrap() {
  await loadOwnerRuntimeConfig();
  assertOwnerAppConfig();

  api.interceptors.request.use(
    (config) => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return Promise.reject({
          isOffline: true,
          message: 'Нет сети'
        });
      }
      return config;
    },
    (err) => Promise.reject(err)
  );

  const extractTokenFromLocation = () => {
    const hashToken = /(?:^|[?#&])token=([^&]+)/.exec(window.location.hash || '')?.[1];
    if (hashToken) return decodeURIComponent(hashToken);

    const queryToken = new URLSearchParams(window.location.search).get('token');
    if (queryToken) return queryToken;

    return null;
  };

  const tokenFromUrl = extractTokenFromLocation();
  if (tokenFromUrl && typeof localStorage !== 'undefined') {
    localStorage.setItem('token', tokenFromUrl);
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}` || '/');
  }

  const app = createApp(App);
  const pinia = createPinia();

  app.use(pinia);
  setAuthTokenGetter(() => useAuthStore().token);
  app.use(router);

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        const message = String(error.response?.data?.error || '').toLowerCase();
        const invalidJwt =
          !message.includes('no token') &&
          (message.includes('invalid token') ||
            message.includes('jwt expired') ||
            message.includes('token expired') ||
            message.includes('malformed'));
        if (invalidJwt) {
          useAuthStore().logout();
          const base = ownerAppConfig.ownerPublicOrigin.replace(/\/$/, '');
          const path = window.location.pathname + window.location.search;
          const returnUrl = encodeURIComponent(`${base}${path}`);
          window.location.href = `${ownerAppConfig.authUiUrl}?return=${returnUrl}`;
        }
      }
      return Promise.reject(error);
    }
  );

  app.mount('#app');

  const authStore = useAuthStore();
  const storedToken = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  if (storedToken && !authStore.token) {
    authStore.setToken(storedToken);
  }
  if (authStore.token) {
    authStore.restoreUser();
  }
}

bootstrap().catch((err) => {
  console.error('[owner-pwa] bootstrap failed', err);
});
