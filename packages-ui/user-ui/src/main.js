import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { useAuthStore } from './stores/auth';
import api from '@boqq/api-client';

const authUiUrl = import.meta.env.VITE_AUTH_UI_URL || 'http://localhost:5174';

// Обработка возврата с auth-ui: токен во fragment
const hash = window.location.hash;
const tokenMatch = hash && hash.includes('token=') && /token=([^&]+)/.exec(hash);
if (tokenMatch) {
  try {
    const token = decodeURIComponent(tokenMatch[1]);
    if (token) {
      localStorage.setItem('token', token);
      window.history.replaceState(null, '', window.location.pathname + window.location.search || '/');
    }
  } catch (_) {}
}

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// При 401 — выход и редирект на форму входа (auth-ui)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore().logout();
      window.location.href = authUiUrl;
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
