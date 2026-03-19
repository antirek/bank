import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { useAuthStore } from './stores/auth';
import api from '@boqq/api-client';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// При 401 очищаем стор авторизации (токен истёк или невалиден)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore().logout();
    }
    return Promise.reject(error);
  }
);

// Восстанавливаем пользователя при загрузке приложения
app.mount('#app');

const authStore = useAuthStore();
if (authStore.token) {
  authStore.restoreUser();
}
