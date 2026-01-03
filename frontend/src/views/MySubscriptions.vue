<template>
  <div class="my-subscriptions-page">
    <div class="container">
      <div class="header">
        <div class="header-left">
          <h1>Мои подписки</h1>
          <router-link to="/profile" class="profile-link">Мой профиль →</router-link>
        </div>
      </div>

      <div v-if="loading" class="loading">
        Загрузка...
      </div>

      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-else-if="businesses.length === 0" class="empty-state">
        <p>Вы пока не подписаны ни на один бизнес</p>
        <router-link to="/catalog" class="btn btn-primary">
          Перейти в каталог
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
            <button
              @click="unsubscribe(business.businessId)"
              class="btn-unsubscribe"
              :disabled="unsubscribing === business.businessId"
            >
              {{ unsubscribing === business.businessId ? 'Отписка...' : 'Отписаться' }}
            </button>
          </div>
          
          <div class="business-info">
            <p class="slug">/{{ business.slug }}</p>
            <p v-if="business.description" class="description">
              {{ business.description }}
            </p>
            <p v-else class="description empty">Нет описания</p>
          </div>

          <div class="business-footer">
            <router-link
              :to="`/business/${business.slug}`"
              class="btn-view"
            >
              Открыть страницу →
            </router-link>
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
const unsubscribing = ref(null);

const loadSubscriptions = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const response = await api.get('/me/subscriptions');
    businesses.value = response.data.data.businesses || [];
  } catch (err) {
    error.value = err.response?.data?.error || 'Ошибка при загрузке подписок';
  } finally {
    loading.value = false;
  }
};

const unsubscribe = async (businessId) => {
  if (!confirm('Вы уверены, что хотите отписаться от этого бизнеса?')) {
    return;
  }

  unsubscribing.value = businessId;
  
  try {
    await api.delete(`/businesses/${businessId}/subscribe`);
    // Удаляем из списка
    businesses.value = businesses.value.filter(b => b.businessId !== businessId);
  } catch (err) {
    alert(err.response?.data?.error || 'Ошибка при отписке');
  } finally {
    unsubscribing.value = null;
  }
};

onMounted(() => {
  loadSubscriptions();
});
</script>

<style scoped>
.my-subscriptions-page {
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

h1 {
  margin: 0;
  color: #333;
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

.btn-unsubscribe {
  padding: 0.5rem 1rem;
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ffcdd2;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-unsubscribe:hover:not(:disabled) {
  background: #ffcdd2;
}

.btn-unsubscribe:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.btn-view {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.btn-view:hover {
  color: #5568d3;
}
</style>
