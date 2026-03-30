<template>
  <div class="business-chats-page">
    <div v-if="loading" class="loading">Загрузка...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>
    <div v-else-if="businesses.length === 0" class="empty-state">
      <p>У вас пока нет бизнесов</p>
    </div>
    <div v-else class="businesses-list">
      <router-link
        v-for="business in businesses"
        :key="business.businessId"
        :to="`/my/businesses/${business.businessId}/dialogs`"
        class="business-chat-item"
      >
        <div class="item-main">
          <h3>{{ business.name || 'Без названия' }}</h3>
          <p class="item-subtitle">Перейти к чатам бизнеса</p>
        </div>
        <div class="item-meta">
          <span v-if="business.unreadDialogsCount > 0" class="unread-badge">
            {{ business.unreadDialogsCount }}
          </span>
          <span class="item-arrow">→</span>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import api from '@boqq/api-client';

const authStore = useAuthStore();
const businesses = ref([]);
const loading = ref(true);
const error = ref('');

const loadBusinesses = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await api.get('/businesses', {
      params: { ownerId: authStore.user?.userId }
    });
    businesses.value = response.data.data || [];

    await Promise.all(
      businesses.value.map(async (business) => {
        try {
          const dialogsResponse = await api.get(`/businesses/${business.businessId}/dialogs`);
          const dialogs = dialogsResponse.data.data || [];
          business.unreadDialogsCount = dialogs.reduce((sum, d) => sum + (d.unreadCount || 0), 0);
        } catch (_) {
          business.unreadDialogsCount = 0;
        }
      })
    );
  } catch (err) {
    error.value = err.response?.data?.error || 'Ошибка при загрузке бизнес-чатов';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadBusinesses();
});
</script>

<style scoped>
.business-chats-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 0.35rem 0 1.75rem;
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

.empty-state {
  text-align: center;
  padding: 2.5rem 1rem;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #ececec;
}

.businesses-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.business-chat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  background: #fff;
  border: 1px solid #e6e6e6;
  border-radius: 10px;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s, background 0.15s;
}

.business-chat-item:hover {
  border-color: #c5cae9;
  background: #f8f9ff;
}

.item-main h3 {
  margin: 0;
  color: #333;
  font-size: 1rem;
}

.item-subtitle {
  margin: 0.3rem 0 0 0;
  color: #777;
  font-size: 0.86rem;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex-shrink: 0;
}

.unread-badge {
  background: #667eea;
  color: #fff;
  border-radius: 999px;
  min-width: 22px;
  height: 22px;
  padding: 0 0.35rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 700;
}

.item-arrow {
  color: #667eea;
  font-size: 1rem;
}
</style>
