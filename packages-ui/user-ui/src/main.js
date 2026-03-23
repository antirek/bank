import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { useAuthStore } from './stores/auth';
import api, { setAuthTokenGetter } from '@boqq/api-client';

const authUiUrl = import.meta.env.VITE_AUTH_UI_URL || 'http://localhost:5174';

// Поддерживаем токен и в hash (#token=...), и в query (?token=...)
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
// Токен из Pinia (источник истины после setToken) + fallback на localStorage в api-client
setAuthTokenGetter(() => useAuthStore().token);
app.use(router);

// Только явно «битый» JWT — иначе «No token provided» содержит подстроку «No token» и сбрасывало сессию
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const message = String(error.response?.data?.error || '').toLowerCase();
      // Не трогаем «no token» — иначе ложный сброс сессии
      const invalidJwt =
        !message.includes('no token') &&
        (message.includes('invalid token') ||
          message.includes('jwt expired') ||
          message.includes('token expired') ||
          message.includes('malformed'));
      if (invalidJwt) {
        useAuthStore().logout();
        window.location.href = authUiUrl;
      }
    }
    return Promise.reject(error);
  }
);

app.mount('#app');

// Явно подхватываем токен из localStorage (на случай возврата с auth-ui или после перезагрузки)
const authStore = useAuthStore();
const storedToken = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
if (storedToken && !authStore.token) {
  authStore.setToken(storedToken);
}
if (authStore.token) {
  authStore.restoreUser();
}
