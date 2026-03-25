<template>
  <div class="profile-home">
    <div v-if="loading" class="loading">
      Загрузка...
    </div>

    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-else class="profile-content">
      <h1 class="page-title">Мой профиль</h1>
      <div class="profile-summary">
        <div class="avatar-wrap">
          <img
            v-if="displayAvatar"
            :src="displayAvatar"
            alt=""
            class="avatar-img"
            width="72"
            height="72"
          />
          <div v-else class="avatar-placeholder">
            {{ userInitials }}
          </div>
        </div>
        <div class="summary-text">
          <p class="user-name">{{ user?.name || 'Без имени' }}</p>
          <p v-if="user?.phone" class="phone">{{ user.phone }}</p>
          <p v-if="user?.userId" class="user-id">ID: {{ user.userId }}</p>
          <router-link to="/my/profile/edit" class="link-edit">
            Изменить профиль
          </router-link>
        </div>
      </div>

      <div class="profile-stats">
        <div class="stat-card">
          <div class="stat-value" aria-hidden="true">✏️</div>
          <div class="stat-label">Изменение профиля</div>
          <router-link to="/my/profile/edit" class="stat-link">
            Перейти →
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import api from '@boqq/api-client';

const authStore = useAuthStore();
const user = ref(null);
const loading = ref(true);
const error = ref('');

const displayAvatar = computed(() => {
  const a = user.value?.avatar;
  return typeof a === 'string' && a.trim() ? a.trim() : '';
});

const userInitials = computed(() => {
  if (user.value?.name?.trim()) {
    return user.value.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
  const phone = user.value?.phone || '';
  return phone.length >= 2 ? phone.slice(-2).toUpperCase() : '??';
});

const loadProfile = async () => {
  loading.value = true;
  error.value = '';

  try {
    if (!authStore.user?.userId) {
      error.value = 'Не удалось определить пользователя';
      return;
    }
    const response = await api.get(`/users/${authStore.user.userId}`);
    user.value = response.data.data;
    authStore.setUser(user.value);
  } catch (err) {
    error.value = err.response?.data?.error || 'Ошибка при загрузке профиля';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadProfile();
});
</script>

<style scoped>
.profile-home {
  margin: 0;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.profile-content {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.page-title {
  margin: 0 0 1.5rem 0;
  color: #333;
  font-size: 1.65rem;
  font-weight: 700;
}

.profile-summary {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-bottom: 2rem;
  padding-bottom: 1.75rem;
  border-bottom: 1px solid #e8e8e8;
  flex-wrap: wrap;
}

.avatar-wrap {
  flex-shrink: 0;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  overflow: hidden;
  background: #eee;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.35rem;
  font-weight: 600;
}

.summary-text {
  min-width: 0;
}

.user-name {
  margin: 0 0 0.35rem 0;
  font-size: 1.35rem;
  font-weight: 600;
  color: #333;
}

.phone {
  color: #666;
  margin: 0.35rem 0 0.25rem 0;
  font-size: 1.05rem;
}

.user-id {
  color: #999;
  margin: 0 0 0.5rem 0;
  font-size: 0.85rem;
  font-family: monospace;
}

.link-edit {
  font-size: 0.95rem;
  font-weight: 500;
  color: #667eea;
  text-decoration: none;
}

.link-edit:hover {
  text-decoration: underline;
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: #f5f5f5;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #666;
  font-size: 1rem;
  margin-bottom: 1rem;
}

.stat-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.stat-link:hover {
  color: #5568d3;
}
</style>
