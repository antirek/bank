<template>
  <div class="dialog-view" :class="{ 'dialog-view--embedded': embedded }">
    <div class="dialog-container">
      <!-- Заголовок -->
      <div class="dialog-header">
        <router-link v-if="!embedded" :to="computedBackUrl" class="back-button">← Назад</router-link>
        <h2>{{ dialogInfo.title }}</h2>
      </div>

      <!-- Сообщения -->
      <div ref="messagesContainer" class="messages-container" @scroll="handleScroll">
        <div v-if="loadingMessages" class="loading-messages">
          Загрузка сообщений...
        </div>
        
        <div v-else-if="messages.length === 0" class="empty-messages">
          <p>Пока нет сообщений. Начните диалог!</p>
        </div>

        <div v-else class="messages-list">
          <div
            v-for="message in messages"
            :key="message.messageId"
            :class="['message', { 'message-own': isOwnMessage(message) }]"
          >
            <div class="message-author-row">
              <div class="message-avatar" :class="{ own: isOwnMessage(message) }">
                {{ getInitials(getAuthorName(message)) }}
              </div>
            </div>
            <div class="message-content">
              <div class="message-author-name">{{ getAuthorName(message) }}</div>
              <p class="message-text">{{ message.content }}</p>
              <span class="message-time">{{ formatTime(message.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Поле ввода -->
      <div class="message-input-container">
        <form @submit.prevent="sendMessage" class="message-form">
          <input
            v-model="messageText"
            type="text"
            placeholder="Введите сообщение..."
            class="message-input"
            :disabled="sending"
            ref="messageInput"
          />
          <button
            type="submit"
            class="send-button"
            :disabled="!messageText.trim() || sending"
          >
            {{ sending ? 'Отправка...' : 'Отправить' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import api from '@boqq/api-client';

const props = defineProps({
  dialogId: {
    type: String,
    required: true
  },
  backUrl: {
    type: String,
    default: null
  },
  embedded: {
    type: Boolean,
    default: false
  }
});

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const messages = ref([]);
const messageText = ref('');
const loadingMessages = ref(true);
const sending = ref(false);
const messagesContainer = ref(null);
const messageInput = ref(null);
const dialogInfo = ref({
  title: 'Диалог',
  businessName: '',
  userName: '',
  businessSlug: '',
  userId: null,
  ownerId: null,
  currentUserMms3Id: null
});
const hasMore = ref(false);
const loadingMore = ref(false);
const scrollPosition = ref(0);
const computedBackUrl = computed(() => {
  if (props.backUrl) return props.backUrl;
  if (dialogInfo.value.businessSlug) {
    return `/b/${dialogInfo.value.businessSlug}`;
  }
  return '/my/dialogs';
});

const isOwnMessage = (message) => {
  if (typeof message?.isOwn === 'boolean') {
    return message.isOwn;
  }
  // Определяем, является ли сообщение своим, сравнивая senderId с mms3UserId
  // Если mms3UserId еще не загружен, используем информацию о диалоге
  if (dialogInfo.value.currentUserMms3Id) {
    return message.senderId === dialogInfo.value.currentUserMms3Id;
  }
  
  // Временная проверка: если текущий пользователь - владелец, то сообщения от него справа
  // Это будет работать после загрузки информации о пользователе
  return false; // По умолчанию не свое, пока не загрузим mms3UserId
};

const getAuthorName = (message) => {
  if (isOwnMessage(message)) {
    return authStore.user?.name || 'Вы';
  }
  return message.senderName || 'Собеседник';
};

const getInitials = (name) => {
  const safe = String(name || '').trim();
  if (!safe) return '?';
  const parts = safe.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
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

const loadDialog = async () => {
  try {
    const response = await api.get(`/dialogs/${props.dialogId}`);
    const dialog = response.data.data;
    
    // Определяем, кто текущий пользователь (клиент или владелец)
    const isOwner = dialog.ownerId === authStore.user?.userId;
    
    dialogInfo.value = {
      title: isOwner ? (dialog.userName || dialog.userPhone || 'Клиент') : (dialog.businessName || 'Бизнес'),
      businessName: dialog.businessName || '',
      userName: dialog.userName || '',
      businessSlug: dialog.businessSlug || '',
      userId: dialog.userId,
      ownerId: dialog.ownerId,
      currentUserMms3Id: null // Будет установлено при загрузке сообщений
    };
    
    // Получаем mms3UserId текущего пользователя
    try {
      const userResponse = await api.get(`/users/${authStore.user.userId}`);
      const userData = userResponse.data.data;
      dialogInfo.value.currentUserMms3Id = userData?.mms3UserId || null;
      
      // Если mms3UserId не найден, но есть в ответе, сохраняем
      if (!dialogInfo.value.currentUserMms3Id && userData) {
        // Попробуем использовать userId, заменив точки на подчеркивания
        dialogInfo.value.currentUserMms3Id = userData.userId?.replace(/\./g, '_') || null;
      }
    } catch (err) {
      console.error('Error loading user mms3UserId:', err);
      // Fallback: используем userId с заменой точек
      dialogInfo.value.currentUserMms3Id = authStore.user?.userId?.replace(/\./g, '_') || null;
    }
  } catch (error) {
    console.error('Error loading dialog:', error);
  }
};

const loadMessages = async (before = null) => {
  try {
    const params = { page: 1, limit: 50 };
    if (before) {
      params.before = before;
    }

    const response = await api.get(`/dialogs/${props.dialogId}/messages`, { params });
    const data = response.data.data;

    if (before) {
      // Добавляем старые сообщения в начало
      messages.value = [...data.messages, ...messages.value];
    } else {
      // Первая загрузка
      messages.value = data.messages;
      // Скроллим вниз
      await nextTick();
      scrollToBottom();
    }

    hasMore.value = data.hasMore || false;
  } catch (error) {
    console.error('Error loading messages:', error);
  } finally {
    loadingMessages.value = false;
    loadingMore.value = false;
  }
};

const sendMessage = async () => {
  if (!messageText.value.trim() || sending.value) return;

  const content = messageText.value.trim();
  messageText.value = '';
  sending.value = true;

  try {
    const response = await api.post(`/dialogs/${props.dialogId}/messages`, {
      content
    });

    // Добавляем сообщение в список
    messages.value.push(response.data.data);
    
    // Скроллим вниз
    await nextTick();
    scrollToBottom();

    // Отмечаем как прочитанный
    await api.patch(`/dialogs/${props.dialogId}/read`);
  } catch (error) {
    console.error('Error sending message:', error);
    alert(error.response?.data?.error || 'Ошибка при отправке сообщения');
    messageText.value = content; // Восстанавливаем текст
  } finally {
    sending.value = false;
    messageInput.value?.focus();
  }
};

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const handleScroll = () => {
  if (!messagesContainer.value || loadingMore.value || !hasMore.value) return;

  // Загружаем старые сообщения при скролле вверх
  if (messagesContainer.value.scrollTop < 100) {
    const oldestMessage = messages.value[0];
    if (oldestMessage) {
      loadingMore.value = true;
      loadMessages(oldestMessage.createdAt);
    }
  }
};

onMounted(async () => {
  await loadDialog();
  await loadMessages();
  messageInput.value?.focus();
});

watch(() => props.dialogId, async (newId) => {
  if (newId) {
    loadingMessages.value = true;
    messages.value = [];
    await loadDialog();
    await loadMessages();
  }
});
</script>

<style scoped>
.dialog-view {
  min-height: calc(100vh - 70px); /* Учитываем высоту UserHeader (~70px) */
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.dialog-view--embedded {
  min-height: 0;
  height: 100%;
  flex: 1;
  background: transparent;
}

.dialog-container {
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  height: calc(100vh - 70px); /* Учитываем высоту UserHeader (~70px) */
  max-height: calc(100vh - 70px);
  display: flex;
  flex-direction: column;
  background: white;
  overflow: hidden; /* Предотвращаем переполнение */
}

.dialog-view--embedded .dialog-container {
  max-width: none;
  margin: 0;
  height: 100%;
  max-height: 100%;
  min-height: 0;
}

.dialog-header {
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  position: sticky;
  top: 0;
  z-index: 10;
}

.dialog-view--embedded .dialog-header {
  padding: 0.65rem 0.85rem;
}

.dialog-view--embedded .dialog-header h2 {
  font-size: 1.05rem;
}

.back-button {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.back-button:hover {
  color: #5568d3;
}

.dialog-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.dialog-view--embedded .messages-container {
  flex: 1 1 0;
  min-height: 0;
}

.loading-messages,
.empty-messages {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: #666;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message {
  display: flex;
  justify-content: flex-start;
  gap: 0.55rem;
  align-items: flex-end;
}

.message-own {
  justify-content: flex-end;
}

.message-author-row {
  display: flex;
  align-items: flex-end;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e8ecff;
  color: #3f51b5;
  font-size: 0.78rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.message-avatar.own {
  background: #e8f5e9;
  color: #2e7d32;
}

.message-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.message-own .message-content {
  align-items: flex-end;
  order: 1;
}

.message-own .message-author-row {
  order: 2;
}

.message-author-name {
  font-size: 0.8rem;
  color: #7a7a7a;
  margin: 0 0 0.1rem 0.25rem;
}

.message-text {
  padding: 0.75rem 1rem;
  border-radius: 12px;
  margin: 0;
  word-wrap: break-word;
  background: #e0e0e0;
  color: #333;
}

.message-own .message-text {
  background: #667eea;
  color: white;
}

.message-time {
  font-size: 0.75rem;
  color: #999;
  padding: 0 0.5rem;
}

.message-input-container {
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
  background: white;
  flex-shrink: 0; /* Предотвращаем сжатие формы ввода */
  position: sticky;
  bottom: 0;
  z-index: 10;
}

.message-form {
  display: flex;
  gap: 0.5rem;
}

.message-input {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.message-input:focus {
  outline: none;
  border-color: #667eea;
}

.send-button {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.send-button:hover:not(:disabled) {
  background: #5568d3;
}

.send-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
