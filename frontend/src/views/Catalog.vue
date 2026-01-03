<template>
  <div class="catalog-page">
    <div class="container">
      <div class="header">
        <div class="header-left">
          <h1>Каталог бизнесов</h1>
          <router-link v-if="authStore.isAuthenticated" to="/profile" class="profile-link">Мой профиль →</router-link>
        </div>
      </div>

      <div class="search-bar">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Поиск по названию или описанию..."
          class="search-input"
        />
      </div>

      <div v-if="loading" class="loading">
        Загрузка...
      </div>

      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-else-if="filteredBusinesses.length === 0" class="empty-state">
        <p>Бизнесы не найдены</p>
      </div>

      <div v-else class="businesses-grid">
        <div
          v-for="business in filteredBusinesses"
          :key="business.businessId"
          class="business-card"
        >
          <div class="business-header">
            <h3>{{ business.name }}</h3>
            <button
              v-if="!isSubscribed(business.businessId)"
              @click="subscribe(business.businessId)"
              class="btn-subscribe"
              :disabled="subscribing === business.businessId"
            >
              {{ subscribing === business.businessId ? 'Подписка...' : '+ Подписаться' }}
            </button>
            <span v-else class="subscribed-badge">
              ✓ Подписан
            </span>
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
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import api from '../api';

const authStore = useAuthStore();
const businesses = ref([]);
const subscriptions = ref([]);
const loading = ref(true);
const error = ref('');
const searchQuery = ref('');
const subscribing = ref(null);

const filteredBusinesses = computed(() => {
  if (!searchQuery.value) {
    return businesses.value;
  }
  
  const query = searchQuery.value.toLowerCase();
  return businesses.value.filter(business => 
    business.name.toLowerCase().includes(query) ||
    (business.description && business.description.toLowerCase().includes(query))
  );
});

const isSubscribed = (businessId) => {
  return subscriptions.value.some(sub => sub.businessId === businessId);
};

const loadBusinesses = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const response = await api.get('/businesses', {
      params: {
        // Получаем только публичные бизнесы
      }
    });
    businesses.value = (response.data.data || []).filter(b => b.isPublic);
  } catch (err) {
    error.value = err.response?.data?.error || 'Ошибка при загрузке каталога';
  } finally {
    loading.value = false;
  }
};

const loadSubscriptions = async () => {
  if (!authStore.isAuthenticated) {
    return;
  }

  try {
    const response = await api.get('/me/subscriptions');
    subscriptions.value = response.data.data.subscriptions || [];
  } catch (err) {
    console.error('Failed to load subscriptions:', err);
  }
};

const subscribe = async (businessId) => {
  if (!authStore.isAuthenticated) {
    alert('Для подписки необходимо войти в систему');
    return;
  }

  subscribing.value = businessId;
  
  try {
    await api.post(`/businesses/${businessId}/subscribe`);
    // Добавляем в список подписок
    subscriptions.value.push({ businessId });
    alert('Вы успешно подписались на бизнес!');
  } catch (err) {
    alert(err.response?.data?.error || 'Ошибка при подписке');
  } finally {
    subscribing.value = null;
  }
};

onMounted(async () => {
  await loadBusinesses();
  await loadSubscriptions();
});
</script>

<style scoped>
.catalog-page {
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

.search-bar {
  margin-bottom: 2rem;
}

.search-input {
  width: 100%;
  max-width: 500px;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
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

.btn-subscribe {
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-subscribe:hover:not(:disabled) {
  background: #5568d3;
}

.btn-subscribe:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.subscribed-badge {
  padding: 0.5rem 1rem;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
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
