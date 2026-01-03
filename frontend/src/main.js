import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { useAuthStore } from './stores/auth';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// Восстанавливаем пользователя при загрузке приложения
// Делаем это после монтирования, чтобы Pinia была полностью инициализирована
app.mount('#app');

// Восстанавливаем пользователя после монтирования
const authStore = useAuthStore();
if (authStore.token) {
  authStore.restoreUser();
}
