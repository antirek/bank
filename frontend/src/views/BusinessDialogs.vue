<template>
  <div class="business-dialogs-page">
    <div class="container">
      <div class="header">
        <router-link :to="`/my-businesses`" class="back-link">← Назад к бизнесам</router-link>
        <h1>Диалоги: {{ businessName }}</h1>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Поиск по имени пользователя..."
          class="search-input"
        />
      </div>

      <div v-if="loading" class="loading">
        Загрузка диалогов...
      </div>

      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-else-if="dialogs.length === 0" class="empty-state">
        <p>Пока нет диалогов с пользователями</p>
      </div>

      <div v-else class="dialogs-list">
        <div
          v-for="dialog in filteredDialogs"
          :key="dialog.dialogId"
          class="dialog-item"
          @click="openDialog(dialog.dialogId)"
        >
          <div class="dialog-avatar">
            {{ getUserInitials(dialog.userName) }}
          </div>
          <div class="dialog-info">
            <div class="dialog-header-info">
              <h3>{{ dialog.userName }}</h3>
              <span v-if="dialog.unreadCount > 0" class="unread-badge">
                {{ dialog.unreadCount }}
              </span>
            </div>
            <p class="dialog-preview">
              {{ dialog.lastMessage?.content || 'Нет сообщений' }}
            </p>
            <span class="dialog-time">
              {{ formatTime(dialog.lastMessageAt) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import api from '../api';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const businessId = route.params.businessId;
const businessName = ref('');
const dialogs = ref([]);
const loading = ref(true);
const error = ref('');
const searchQuery = ref('');

const filteredDialogs = computed(() => {
  if (!searchQuery.value) {
    return dialogs.value;
  }
  
  const query = searchQuery.value.toLowerCase();
  return dialogs.value.filter(dialog =>
    dialog.userName.toLowerCase().includes(query) ||
    dialog.userPhone.toLowerCase().includes(query)
  );
});

const getUserInitials = (name) => {
  if (!name || name === 'Без имени') return '??';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'только что';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} мин назад`;
  if (diff < 86400000) return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
};

const loadDialogs = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const response = await api.get(`/businesses/${businessId}/dialogs`, {
      params: {
        search: searchQuery.value || undefined
      }
    });
    dialogs.value = response.data.data || [];
    
    // Получаем название бизнеса из первого диалога или отдельным запросом
    if (dialogs.value.length > 0) {
      // Можно загрузить отдельно, но пока используем businessId
    }
    
    // Загружаем название бизнеса
    try {
      const businessResponse = await api.get(`/businesses/${businessId}`);
      businessName.value = businessResponse.data.data?.name || 'Бизнес';
    } catch (err) {
      businessName.value = 'Бизнес';
    }
  } catch (err) {
    error.value = err.response?.data?.error || 'Ошибка при загрузке диалогов';
  } finally {
    loading.value = false;
  }
};

const openDialog = (dialogId) => {
  router.push({
    name: 'BusinessDialogView',
    params: {
      businessId: businessId,
      dialogId: dialogId
    }
  });
};

onMounted(() => {
  loadDialogs();
});
</script>

<style scoped>
.business-dialogs-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 2rem;
}

.container {
  max-width: 800px;
  margin: 0 auto;
}

.header {
  margin-bottom: 2rem;
}

.back-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  margin-bottom: 1rem;
  display: inline-block;
}

.back-link:hover {
  color: #5568d3;
}

h1 {
  margin: 0.5rem 0 1rem 0;
  color: #333;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
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

.dialogs-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dialog-item {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.dialog-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.dialog-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  flex-shrink: 0;
}

.dialog-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.dialog-header-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-header-info h3 {
  margin: 0;
  font-size: 1rem;
  color: #333;
}

.unread-badge {
  background: #667eea;
  color: white;
  border-radius: 12px;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
}

.dialog-preview {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dialog-time {
  color: #999;
  font-size: 0.75rem;
  align-self: flex-end;
}
</style>
