<template>
  <div class="home">
    <header class="header">
      <h1>Bank</h1>
      <p>Система общения бизнеса и клиентов</p>
      <div class="auth-section">
      <div v-if="authStore.isAuthenticated" class="user-info">
        <router-link to="/profile" class="profile-link-header">
          <span>Привет, {{ authStore.user?.name || authStore.user?.phone }}!</span>
        </router-link>
        <button @click="handleLogout" class="btn-logout">Выйти</button>
      </div>
        <router-link v-else to="/login" class="btn-login">Войти</router-link>
      </div>
    </header>
    <main class="main">
      <div v-if="authStore.isAuthenticated" class="actions">
        <router-link to="/my-businesses" class="btn-create">
          Мои бизнесы
        </router-link>
        <router-link to="/my-subscriptions" class="btn-create">
          Мои подписки
        </router-link>
        <router-link to="/create-business" class="btn-create">
          + Создать бизнес
        </router-link>
      </div>
      <div class="actions">
        <router-link to="/catalog" class="btn-create">
          Каталог бизнесов
        </router-link>
      </div>
      <div class="status-card">
        <h2>Статус системы</h2>
        <div class="status-item">
          <span class="label">Backend API:</span>
          <span :class="['status', apiStatus]">{{ apiStatusText }}</span>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import api from '../api';

const router = useRouter();
const authStore = useAuthStore();

const apiStatus = ref('checking');
const apiStatusText = ref('Проверка...');

const checkApiStatus = async () => {
  try {
    const response = await api.get('/health');
    if (response.data.status === 'ok') {
      apiStatus.value = 'ok';
      apiStatusText.value = 'Работает';
    } else {
      apiStatus.value = 'error';
      apiStatusText.value = 'Ошибка';
    }
  } catch (error) {
    apiStatus.value = 'error';
    apiStatusText.value = 'Недоступен';
  }
};

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};

onMounted(() => {
  checkApiStatus();
});
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.header {
  text-align: center;
  color: white;
  margin-bottom: 3rem;
}

.header h1 {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.header p {
  font-size: 1.2rem;
  opacity: 0.9;
}

.auth-section {
  margin-top: 1.5rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: white;
}

.profile-link-header {
  color: white;
  text-decoration: none;
  transition: opacity 0.2s;
}

.profile-link-header:hover {
  opacity: 0.8;
}

.btn-logout,
.btn-login {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.btn-logout:hover,
.btn-login:hover {
  background: rgba(255, 255, 255, 0.3);
}

.actions {
  margin-bottom: 2rem;
  text-align: center;
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn-create {
  display: inline-block;
  padding: 1rem 2rem;
  background: #667eea;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: background 0.2s;
}

.btn-create:hover {
  background: #5568d3;
}

.main {
  max-width: 800px;
  margin: 0 auto;
}

.status-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.status-card h2 {
  margin-bottom: 1.5rem;
  color: #333;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.label {
  font-weight: 500;
  color: #666;
}

.status {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
}

.status.checking {
  background: #e3f2fd;
  color: #1976d2;
}

.status.ok {
  background: #e8f5e9;
  color: #2e7d32;
}

.status.error {
  background: #ffebee;
  color: #c62828;
}
</style>
