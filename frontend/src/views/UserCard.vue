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
        <!-- Профиль пользователя -->
        <div class="user-profile-section">
          <div class="user-avatar-large">
            {{ userInitials }}
          </div>
          <h1>{{ user.name || user.phone || 'Пользователь' }}</h1>
          <p v-if="user.phone" class="user-phone">{{ user.phone }}</p>
          
          <!-- Счетчики -->
          <div class="user-stats">
            <div class="stat-item">
              <span class="stat-label">Бизнесы</span>
              <span class="stat-value">{{ businessesCount }}</span>
            </div>
            <div v-if="isMyCard" class="stat-item">
              <span class="stat-label">Подписан на</span>
              <span class="stat-value">{{ subscriptionsCount }}</span>
            </div>
          </div>
          
          <!-- Если это моя карточка, показываем кнопки действий -->
          <div v-if="isMyCard" class="user-actions">
            <router-link
              to="/my-dialogs"
              class="btn-action btn-dialogs"
            >
              💬 Мои переписки
            </router-link>
            <router-link
              to="/profile"
              class="btn-action btn-profile"
            >
              Перейти в профиль →
            </router-link>
          </div>
        </div>

        <!-- Лента новостей (только для своей карточки) -->
        <div v-if="isMyCard" class="news-feed-section">
          <h2>Лента новостей</h2>
          <div v-if="newsFeedLoading" class="loading-small">
            Загрузка новостей...
          </div>
          <div v-else-if="newsFeed.length === 0" class="no-news">
            В ленте пока нет новостей. Подпишитесь на бизнесы, чтобы видеть их новости здесь.
          </div>
          <div v-else class="news-feed-list">
            <div v-for="newsItem in newsFeed" :key="newsItem.newsId" class="news-feed-item">
              <div class="news-feed-header">
                <router-link
                  v-if="newsItem.business"
                  :to="`/business/${newsItem.business.slug}`"
                  class="news-business-link"
                >
                  {{ newsItem.business.name }}
                </router-link>
                <span v-else class="news-business-name">Неизвестный бизнес</span>
                <span class="news-date">{{ formatDate(newsItem.createdAt) }}</span>
              </div>
              <h3 class="news-title">{{ newsItem.title }}</h3>
              <p class="news-content">{{ newsItem.content }}</p>
            </div>
          </div>
        </div>

        <!-- Список бизнесов -->
        <div class="businesses-section">
          <h2>Бизнесы пользователя</h2>
          <div v-if="businessesLoading" class="loading-small">
            Загрузка бизнесов...
          </div>
          <div v-else-if="businesses.length === 0" class="no-businesses">
            У пользователя пока нет бизнесов
          </div>
          <div v-else class="businesses-list">
            <router-link
              v-for="business in businesses"
              :key="business.businessId"
              :to="`/business/${business.slug}`"
              class="business-item"
            >
              <div class="business-info">
                <h3>{{ business.name }}</h3>
                <p v-if="business.description" class="business-description">
                  {{ business.description }}
                </p>
                <p class="business-slug">/{{ business.slug }}</p>
              </div>
              <div class="business-arrow">→</div>
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
import api from '../api';

const route = useRoute();
const authStore = useAuthStore();
const user = ref(null);
const businesses = ref([]);
const subscriptions = ref([]);
const newsFeed = ref([]);
const loading = ref(true);
const businessesLoading = ref(false);
const subscriptionsLoading = ref(false);
const newsFeedLoading = ref(false);
const error = ref('');

const userInitials = computed(() => {
  if (!user.value) return '??';
  const name = user.value.name;
  if (!name || name.trim() === '') {
    const phone = user.value.phone || '';
    return phone.slice(-2).toUpperCase();
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

const businessesCount = computed(() => {
  return businesses.value.length;
});

const subscriptionsCount = computed(() => {
  return subscriptions.value.length;
});

const loadUser = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const response = await api.get(`/users/${route.params.userId}`);
    user.value = response.data.data;
    
    // Загружаем бизнесы пользователя
    await loadBusinesses();
    
    // Загружаем подписки и ленту новостей, если это моя карточка
    if (authStore.isAuthenticated && authStore.user?.userId === user.value.userId) {
      await loadSubscriptions();
      await loadNewsFeed();
    }
  } catch (err) {
    error.value = err.response?.data?.error || 'Пользователь не найден';
  } finally {
    loading.value = false;
  }
};

const loadBusinesses = async () => {
  if (!user.value?.userId) return;
  
  businessesLoading.value = true;
  
  try {
    const response = await api.get(`/businesses?ownerId=${user.value.userId}`);
    businesses.value = response.data.data || [];
  } catch (err) {
    console.error('Failed to load businesses:', err);
    businesses.value = [];
  } finally {
    businessesLoading.value = false;
  }
};

const loadSubscriptions = async () => {
  if (!authStore.isAuthenticated) return;
  
  subscriptionsLoading.value = true;
  
  try {
    const response = await api.get('/me/subscriptions');
    const data = response.data.data || {};
    subscriptions.value = data.subscriptions || data.businesses || [];
  } catch (err) {
    console.error('Failed to load subscriptions:', err);
    subscriptions.value = [];
  } finally {
    subscriptionsLoading.value = false;
  }
};

const loadNewsFeed = async () => {
  if (!authStore.isAuthenticated || !user.value?.userId) return;
  
  newsFeedLoading.value = true;
  
  try {
    const response = await api.get(`/users/${user.value.userId}/news-feed`);
    newsFeed.value = response.data.data || [];
  } catch (err) {
    console.error('Failed to load news feed:', err);
    newsFeed.value = [];
  } finally {
    newsFeedLoading.value = false;
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
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

.loading-small {
  text-align: center;
  padding: 1.5rem;
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

.user-profile-section {
  text-align: center;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 2rem;
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
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 2rem;
}

.user-phone {
  color: #666;
  font-size: 1.1rem;
  margin: 0;
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

.btn-dialogs {
  background: #667eea;
}

.btn-dialogs:hover {
  background: #5568d3;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
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
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
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

.businesses-section h2 {
  margin: 0 0 1.5rem 0;
  color: #333;
  font-size: 1.5rem;
}

.no-businesses {
  text-align: center;
  padding: 2rem;
  color: #999;
  font-style: italic;
}

.businesses-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.business-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
}

.business-item:hover {
  background: #e9ecef;
  border-color: #667eea;
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
}

.business-info {
  flex: 1;
  min-width: 0;
}

.business-info h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.2rem;
}

.business-description {
  color: #666;
  margin: 0.5rem 0;
  line-height: 1.5;
  font-size: 0.95rem;
}

.business-slug {
  color: #667eea;
  font-weight: 600;
  font-family: monospace;
  font-size: 0.9rem;
  margin: 0.5rem 0 0 0;
}

.business-arrow {
  font-size: 1.5rem;
  color: #667eea;
  margin-left: 1rem;
  flex-shrink: 0;
}

.news-feed-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e0e0e0;
}

.news-feed-section h2 {
  margin: 0 0 1.5rem 0;
  color: #333;
  font-size: 1.5rem;
}

.no-news {
  text-align: center;
  padding: 2rem;
  color: #999;
  font-style: italic;
}

.news-feed-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.news-feed-item {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  transition: all 0.2s;
}

.news-feed-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.news-feed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
}

.news-business-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95rem;
  transition: color 0.2s;
}

.news-business-link:hover {
  color: #5568d3;
  text-decoration: underline;
}

.news-business-name {
  color: #666;
  font-weight: 600;
  font-size: 0.95rem;
}

.news-date {
  color: #666;
  font-size: 0.85rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.news-title {
  margin: 0 0 0.75rem 0;
  color: #333;
  font-size: 1.2rem;
  font-weight: 600;
}

.news-content {
  color: #555;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
}
</style>
