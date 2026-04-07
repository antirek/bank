import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { useAuthStore } from './stores/auth';
import api, { setAuthTokenGetter } from '@boqq/api-client';
import { loadUserPublicRuntime, userPublicRuntime } from './config/publicRuntime';

function authUiForRedirect() {
  return (
    userPublicRuntime.authUiUrl?.trim() ||
    import.meta.env.VITE_AUTH_UI_URL ||
    'http://localhost:5174'
  );
}

async function bootstrap() {
  await loadUserPublicRuntime();

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
          const authUiUrl = authUiForRedirect();
          const path = window.location.pathname + window.location.search;
          if (path.startsWith('/embed/')) {
            const ret = encodeURIComponent(window.location.origin + path);
            window.location.href = `${authUiUrl}?return=${ret}`;
          } else {
            window.location.href = authUiUrl;
          }
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
  console.error('[user-ui] bootstrap failed', err);
});
