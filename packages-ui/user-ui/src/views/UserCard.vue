<template>
  <div class="user-card-page">
    <div class="container">
      <div v-if="loading" class="loading">
        Загрузка...
      </div>

      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-else-if="user" class="user-content">
        <div class="user-card-header">
          <div class="user-avatar-large">
            {{ userInitials }}
          </div>
          <h1>{{ user.name || 'Пользователь' }}</h1>
        </div>

        <div class="user-info-panel">
          <div class="user-stats">
            <div class="stat-item">
              <span class="stat-label">Подписан на</span>
              <span class="stat-value">{{ subscriptionsCount }}</span>
            </div>
          </div>
          <div v-if="isMyCard" class="user-actions">
            <router-link
              to="/my/profile"
              class="btn-action btn-profile"
            >
              Перейти в профиль →
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import api from '@boqq/api-client';

const route = useRoute();
const authStore = useAuthStore();
const user = ref(null);
const loading = ref(true);
const error = ref('');

const userInitials = computed(() => {
  if (!user.value) return '??';
  const name = user.value.name;
  if (!name || name.trim() === '') {
    return '??';
  }
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
});

const isMyCard = computed(() => {
  if (!authStore.isAuthenticated || !user.value) {
    return false;
  }
  return authStore.user?.userId === user.value.userId;
});

const subscriptionsCount = computed(() => {
  const n = user.value?.subscriptionsCount;
  return typeof n === 'number' ? n : 0;
});

const loadUser = async () => {
  loading.value = true;
  error.value = '';

  try {
    const response = await api.get(`/users/${route.params.userId}`);
    user.value = response.data.data;
  } catch (err) {
    error.value = err.response?.data?.error || 'Пользователь не найден';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadUser();
});
</script>

<style scoped>
.user-card-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 2rem;
}

.container {
  max-width: 800px;
  margin: 0 auto;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.user-content {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.user-card-header {
  text-align: center;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid #e8e8e8;
}

.user-info-panel {
  text-align: center;
  padding-top: 1.25rem;
}

.user-avatar-large {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 2.5rem;
  margin: 0 auto 1.5rem;
}

h1 {
  margin: 0;
  color: #333;
  font-size: 2rem;
}

.user-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
  flex-wrap: wrap;
}

.btn-action {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.btn-profile {
  background: #764ba2;
}

.btn-profile:hover {
  background: #5a3a7a;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(118, 75, 162, 0.3);
}

.user-stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
  padding-top: 0.25rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #667eea;
}
</style>
