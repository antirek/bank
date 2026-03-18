<template>
  <div class="my-dialogs-page">
    <div class="container">
      <div class="page-header">
        <h1>Мои переписки</h1>
      </div>

      <div v-if="loading" class="loading">
        Загрузка переписок...
      </div>

      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-else-if="dialogs.length === 0" class="empty-dialogs">
        <p>У вас пока нет переписок</p>
        <p class="empty-hint">Начните диалог с любого бизнеса на его странице</p>
      </div>

      <div v-else class="dialogs-list">
        <router-link
          v-for="dialog in dialogs"
          :key="dialog.dialogId"
          :to="`/dialogs/${dialog.dialogId}`"
          class="dialog-item"
        >
          <div class="dialog-info">
            <h3 class="dialog-business-name">{{ dialog.businessName }}</h3>
            <p v-if="dialog.lastMessage" class="dialog-last-message">
              {{ dialog.lastMessage.content }}
            </p>
            <p v-else class="dialog-last-message empty">
              Нет сообщений
            </p>
            <span v-if="dialog.lastMessageAt" class="dialog-time">
              {{ formatTime(dialog.lastMessageAt) }}
            </span>
          </div>
          <div class="dialog-meta">
            <span v-if="dialog.unreadCount > 0" class="unread-badge">
              {{ dialog.unreadCount }}
            </span>
            <span class="dialog-arrow">→</span>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import api from '../api';

const authStore = useAuthStore();
const dialogs = ref([]);
const loading = ref(true);
const error = ref('');

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'только что';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} мин назад`;
  if (diff < 86400000) return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days} ${days === 1 ? 'день' : 'дня'} назад`;
  }
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
};

const loadDialogs = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const response = await api.get('/dialogs/me');
    dialogs.value = response.data.data || [];
  } catch (err) {
    console.error('Error loading dialogs:', err);
    error.value = err.response?.data?.error || 'Ошибка при загрузке переписок';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadDialogs();
});
</script>

<style scoped>
.my-dialogs-page {
  min-height: calc(100vh - 70px);
  background: #f5f5f5;
  padding: 2rem;
}

.container {
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  margin: 0;
  color: #333;
  font-size: 2rem;
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

.empty-dialogs {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.empty-dialogs p {
  margin: 0.5rem 0;
  color: #666;
  font-size: 1.1rem;
}

.empty-hint {
  color: #999;
  font-size: 0.95rem;
  font-style: italic;
}

.dialogs-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dialog-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
}

.dialog-item:hover {
  background: #f8f9fa;
  border-color: #667eea;
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
}

.dialog-info {
  flex: 1;
  min-width: 0;
}

.dialog-business-name {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.2rem;
  font-weight: 600;
}

.dialog-last-message {
  margin: 0.5rem 0;
  color: #666;
  font-size: 0.95rem;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.dialog-last-message.empty {
  color: #999;
  font-style: italic;
}

.dialog-time {
  font-size: 0.85rem;
  color: #999;
  margin-top: 0.5rem;
  display: block;
}

.dialog-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.unread-badge {
  background: #667eea;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 24px;
}

.dialog-arrow {
  font-size: 1.5rem;
  color: #667eea;
}
</style>
