<template>
  <div class="profile-page">
    <div class="container">
      <h1>Мой профиль</h1>

      <div v-if="loading" class="loading">
        Загрузка...
      </div>

      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-else class="profile-content">
        <div class="profile-header">
          <div class="avatar-section">
            <div class="avatar-placeholder">
              {{ userInitials }}
            </div>
            <input
              type="file"
              ref="avatarInput"
              accept="image/*"
              @change="handleAvatarChange"
              style="display: none"
            />
            <button @click="$refs.avatarInput.click()" class="btn-change-avatar">
              Изменить аватар
            </button>
          </div>
          
          <div class="profile-info">
            <h2>{{ user.name || 'Без имени' }}</h2>
            <p class="phone">{{ user.phone }}</p>
            <p class="user-id">ID: {{ user.userId }}</p>
          </div>
        </div>

        <form @submit.prevent="handleSubmit" class="profile-form">
          <div class="form-group">
            <label for="name">Имя</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              placeholder="Введите ваше имя"
            />
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Сохранение...' : 'Сохранить изменения' }}
            </button>
          </div>

          <div v-if="saveError" class="error-message">
            {{ saveError }}
          </div>

          <div v-if="saveSuccess" class="success-message">
            Профиль успешно обновлен!
          </div>
        </form>

        <div class="profile-stats">
          <div class="stat-card">
            <div class="stat-value">{{ businessesCount }}</div>
            <div class="stat-label">Мои бизнесы</div>
            <router-link to="/my-businesses" class="stat-link">
              Перейти →
            </router-link>
          </div>
          
          <div class="stat-card">
            <div class="stat-value">{{ subscriptionsCount }}</div>
            <div class="stat-label">Мои подписки</div>
            <router-link to="/my-subscriptions" class="stat-link">
              Перейти →
            </router-link>
          </div>
          
          <div class="stat-card">
            <div class="stat-value">📋</div>
            <div class="stat-label">Каталог</div>
            <router-link to="/catalog" class="stat-link">
              Перейти →
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import api from '../api';

const authStore = useAuthStore();
const user = ref(null);
const loading = ref(true);
const error = ref('');
const saving = ref(false);
const saveError = ref('');
const saveSuccess = ref(false);
const businessesCount = ref(0);
const subscriptionsCount = ref(0);

const form = ref({
  name: ''
});

const userInitials = computed(() => {
  if (user.value?.name) {
    return user.value.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
  return user.value?.phone?.substring(user.value.phone.length - 2) || '??';
});

const loadProfile = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    // Используем данные из authStore или загружаем из API
    if (authStore.user) {
      user.value = { ...authStore.user };
      form.value.name = user.value.name || '';
    } else {
      // Если нет в store, можно загрузить из API
      const response = await api.get(`/users/${authStore.user?.userId}`);
      user.value = response.data.data;
      form.value.name = user.value.name || '';
    }
    
    // Загружаем статистику
    await loadStats();
  } catch (err) {
    error.value = err.response?.data?.error || 'Ошибка при загрузке профиля';
  } finally {
    loading.value = false;
  }
};

const loadStats = async () => {
  try {
    // Количество бизнесов
    const businessesResponse = await api.get('/businesses', {
      params: { ownerId: authStore.user?.userId }
    });
    businessesCount.value = businessesResponse.data.data?.length || 0;

    // Количество подписок
    const subscriptionsResponse = await api.get('/me/subscriptions');
    subscriptionsCount.value = subscriptionsResponse.data.data?.businesses?.length || 
                               subscriptionsResponse.data.data?.subscriptions?.length || 0;
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
};

const handleSubmit = async () => {
  saveError.value = '';
  saveSuccess.value = false;
  saving.value = true;

  try {
    const response = await api.put(`/users/${authStore.user.userId}`, {
      name: form.value.name
    });
    
    user.value = response.data.data;
    authStore.setUser(user.value);
    
    saveSuccess.value = true;
    
    setTimeout(() => {
      saveSuccess.value = false;
    }, 3000);
  } catch (err) {
    saveError.value = err.response?.data?.error || 'Ошибка при сохранении профиля';
  } finally {
    saving.value = false;
  }
};

const handleAvatarChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // TODO: Реализовать загрузку аватара
  // Пока просто показываем сообщение
  alert('Загрузка аватара будет реализована позже');
};

onMounted(() => {
  loadProfile();
});
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 2rem;
}

.container {
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  margin: 0 0 2rem 0;
  color: #333;
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

.profile-content {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.profile-header {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e0e0e0;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.avatar-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2.5rem;
  font-weight: 600;
}

.btn-change-avatar {
  padding: 0.5rem 1rem;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-change-avatar:hover {
  background: #e0e0e0;
}

.profile-info {
  flex: 1;
}

.profile-info h2 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.5rem;
}

.phone {
  color: #666;
  margin: 0.5rem 0;
  font-size: 1.1rem;
}

.user-id {
  color: #999;
  margin: 0.5rem 0 0 0;
  font-size: 0.9rem;
  font-family: monospace;
}

.profile-form {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e0e0e0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

label {
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
}

input {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

input:focus {
  outline: none;
  border-color: #667eea;
}

.form-actions {
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5568d3;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.success-message {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
  margin-top: 1rem;
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
