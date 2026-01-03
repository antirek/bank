<template>
  <div class="my-businesses-page">
    <div class="container">
      <div class="header">
        <div class="header-left">
          <h1>Мои бизнесы</h1>
          <router-link to="/profile" class="profile-link">Мой профиль →</router-link>
        </div>
        <router-link to="/create-business" class="btn btn-primary">
          + Создать бизнес
        </router-link>
      </div>

      <div v-if="loading" class="loading">
        Загрузка...
      </div>

      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-else-if="businesses.length === 0" class="empty-state">
        <p>У вас пока нет бизнесов</p>
        <router-link to="/create-business" class="btn btn-primary">
          Создать первый бизнес
        </router-link>
      </div>

      <div v-else class="businesses-grid">
        <div
          v-for="business in businesses"
          :key="business.businessId"
          class="business-card"
        >
          <div class="business-header">
            <h3>{{ business.name }}</h3>
            <div class="business-actions">
              <router-link
                :to="`/businesses/${business.businessId}/edit`"
                class="btn-icon"
                title="Редактировать"
              >
                ✏️
              </router-link>
            </div>
          </div>
          
          <div class="business-info">
            <p class="slug">/{{ business.slug }}</p>
            <p v-if="business.description" class="description">
              {{ business.description }}
            </p>
            <p v-else class="description empty">Нет описания</p>
          </div>

          <div class="business-footer">
            <span class="status" :class="{ active: business.isActive }">
              {{ business.isActive ? 'Активен' : 'Неактивен' }}
            </span>
            <span class="public-status">
              {{ business.isPublic ? 'Публичный' : 'Приватный' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import api from '../api';

const authStore = useAuthStore();
const businesses = ref([]);
const loading = ref(true);
const error = ref('');

const loadBusinesses = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const response = await api.get('/businesses', {
      params: {
        ownerId: authStore.user?.userId
      }
    });
    businesses.value = response.data.data || [];
  } catch (err) {
    error.value = err.response?.data?.error || 'Ошибка при загрузке бизнесов';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadBusinesses();
});
</script>

<style scoped>
.my-businesses-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 2rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.profile-link {
  color: #667eea;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: color 0.2s;
}

.profile-link:hover {
  color: #5568d3;
}

h1 {
  margin: 0;
  color: #333;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  text-align: center;
  transition: all 0.2s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5568d3;
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

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.empty-state p {
  color: #666;
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
}

.businesses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.business-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.business-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.business-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.business-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.25rem;
  flex: 1;
}

.business-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  padding: 0.5rem;
  background: #f5f5f5;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
  font-size: 1.2rem;
  transition: background 0.2s;
}

.btn-icon:hover {
  background: #e0e0e0;
}

.business-info {
  margin-bottom: 1rem;
}

.slug {
  color: #667eea;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  font-family: monospace;
}

.description {
  color: #666;
  margin: 0.5rem 0 0 0;
  line-height: 1.5;
}

.description.empty {
  color: #999;
  font-style: italic;
}

.business-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
  font-size: 0.9rem;
}

.status {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  background: #f5f5f5;
  color: #666;
}

.status.active {
  background: #e8f5e9;
  color: #2e7d32;
}

.public-status {
  color: #999;
}
</style>
