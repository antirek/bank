<template>
  <div class="my-dialogs-page">
    <div class="container">
      <div class="page-header">
        <h1>Мои переписки</h1>
      </div>

      <div v-if="loading" class="loading">Загрузка переписок...</div>
      <div v-else-if="error" class="error-message">{{ error }}</div>
      <div v-else-if="dialogs.length === 0" class="empty-dialogs">
        <p>У вас пока нет переписок</p>
        <p class="empty-hint">Начните диалог с любого бизнеса на его странице</p>
      </div>

      <div v-else class="dialogs-layout">
        <aside class="dialogs-sidebar">
          <div class="dialogs-list">
            <router-link
              v-for="dialog in dialogs"
              :key="dialog.dialogId"
              :to="{ name: 'DialogView', params: { dialogId: dialog.dialogId } }"
              class="dialog-item"
              :class="{ active: String(dialog.dialogId) === selectedDialogId }"
            >
              <div class="dialog-info">
                <h3 class="dialog-business-name">{{ dialog.businessName || 'Диалог' }}</h3>
                <p v-if="dialog.lastMessage?.content" class="dialog-last-message">
                  {{ dialog.lastMessage.content }}
                </p>
                <p v-else class="dialog-last-message empty">Нет сообщений</p>
                <span v-if="dialog.lastMessageAt" class="dialog-time">
                  {{ formatTime(dialog.lastMessageAt) }}
                </span>
              </div>
              <div class="dialog-meta">
                <span v-if="dialog.unreadCount > 0" class="unread-badge">
                  {{ dialog.unreadCount }}
                </span>
              </div>
            </router-link>
          </div>
        </aside>

        <section class="chat-main">
          <template v-if="!selectedDialogId">
            <div class="empty-chat">Выберите чат слева</div>
          </template>
          <template v-else>
            <div class="chat-header">
              <h2>{{ dialogInfo.title || activeDialog?.businessName || 'Диалог' }}</h2>
            </div>

            <div ref="messagesContainer" class="messages-container" @scroll="handleScroll">
              <div v-if="loadingMessages" class="loading-messages">Загрузка сообщений...</div>
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

            <div class="message-input-container">
              <form class="message-form" @submit.prevent="sendMessage">
                <input
                  ref="messageInput"
                  v-model="messageText"
                  type="text"
                  placeholder="Введите сообщение..."
                  class="message-input"
                  :disabled="sending"
                />
                <button type="submit" class="send-button" :disabled="!messageText.trim() || sending">
                  {{ sending ? 'Отправка...' : 'Отправить' }}
                </button>
              </form>
            </div>
          </template>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import api from '@boqq/api-client';

const props = defineProps({
  dialogId: {
    type: String,
    default: ''
  }
});

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const dialogs = ref([]);
const loading = ref(true);
const error = ref('');

const messages = ref([]);
const messageText = ref('');
const loadingMessages = ref(false);
const loadingMore = ref(false);
const hasMore = ref(false);
const sending = ref(false);
const messagesContainer = ref(null);
const messageInput = ref(null);
const dialogInfo = ref({
  title: 'Диалог',
  businessSlug: '',
  ownerId: null,
  currentUserMms3Id: null
});

const selectedDialogId = computed(() => String(props.dialogId || route.params.dialogId || ''));
const activeDialog = computed(() => dialogs.value.find((d) => String(d.dialogId) === selectedDialogId.value));

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

const getInitials = (name) => {
  const safe = String(name || '').trim();
  if (!safe) return '?';
  const parts = safe.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
};

const isOwnMessage = (message) => {
  if (typeof message?.isOwn === 'boolean') return message.isOwn;
  if (dialogInfo.value.currentUserMms3Id) return message.senderId === dialogInfo.value.currentUserMms3Id;
  return false;
};

const getAuthorName = (message) => {
  if (isOwnMessage(message)) return authStore.user?.name || 'Вы';
  return message.senderName || 'Собеседник';
};

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const loadDialogs = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await api.get('/dialogs/me');
    dialogs.value = response.data.data || [];
    if (!selectedDialogId.value && dialogs.value.length) {
      await router.replace({
        name: 'DialogView',
        params: { dialogId: dialogs.value[0].dialogId }
      });
    }
  } catch (err) {
    console.error('Error loading dialogs:', err);
    error.value = err.response?.data?.error || 'Ошибка при загрузке переписок';
  } finally {
    loading.value = false;
  }
};

const loadDialogMeta = async () => {
  if (!selectedDialogId.value) return;
  try {
    const response = await api.get(`/dialogs/${selectedDialogId.value}`);
    const dialog = response.data.data;
    const isOwner = dialog.ownerId === authStore.user?.userId;
    dialogInfo.value = {
      title: isOwner ? dialog.userName || dialog.userPhone || 'Клиент' : dialog.businessName || 'Бизнес',
      businessSlug: dialog.businessSlug || '',
      ownerId: dialog.ownerId,
      currentUserMms3Id: null
    };

    try {
      const userResponse = await api.get(`/users/${authStore.user.userId}`);
      const userData = userResponse.data.data;
      dialogInfo.value.currentUserMms3Id =
        userData?.mms3UserId || userData?.userId?.replace(/\./g, '_') || null;
    } catch (userErr) {
      console.error('Error loading user mms3UserId:', userErr);
      dialogInfo.value.currentUserMms3Id = authStore.user?.userId?.replace(/\./g, '_') || null;
    }
  } catch (err) {
    console.error('Error loading dialog:', err);
  }
};

const loadMessages = async (before = null) => {
  if (!selectedDialogId.value) return;
  try {
    const params = { page: 1, limit: 50 };
    if (before) params.before = before;
    const response = await api.get(`/dialogs/${selectedDialogId.value}/messages`, { params });
    const data = response.data.data;
    if (before) {
      messages.value = [...data.messages, ...messages.value];
    } else {
      messages.value = data.messages;
      await nextTick();
      scrollToBottom();
    }
    hasMore.value = data.hasMore || false;
  } catch (err) {
    console.error('Error loading messages:', err);
  } finally {
    loadingMessages.value = false;
    loadingMore.value = false;
  }
};

const markDialogRead = async () => {
  if (!selectedDialogId.value) return;
  try {
    await api.patch(`/dialogs/${selectedDialogId.value}/read`);
    dialogs.value = dialogs.value.map((d) =>
      String(d.dialogId) === selectedDialogId.value ? { ...d, unreadCount: 0 } : d
    );
  } catch (err) {
    console.error('Error marking dialog as read:', err);
  }
};

const sendMessage = async () => {
  if (!selectedDialogId.value || !messageText.value.trim() || sending.value) return;
  const content = messageText.value.trim();
  messageText.value = '';
  sending.value = true;
  try {
    const response = await api.post(`/dialogs/${selectedDialogId.value}/messages`, { content });
    messages.value.push(response.data.data);
    await markDialogRead();
    await nextTick();
    scrollToBottom();
    await loadDialogs();
  } catch (err) {
    console.error('Error sending message:', err);
    alert(err.response?.data?.error || 'Ошибка при отправке сообщения');
    messageText.value = content;
  } finally {
    sending.value = false;
    messageInput.value?.focus();
  }
};

const handleScroll = () => {
  if (!messagesContainer.value || loadingMore.value || !hasMore.value) return;
  if (messagesContainer.value.scrollTop < 100) {
    const oldestMessage = messages.value[0];
    if (oldestMessage) {
      loadingMore.value = true;
      loadMessages(oldestMessage.createdAt);
    }
  }
};

watch(
  () => selectedDialogId.value,
  async (newDialogId) => {
    if (!newDialogId) return;
    loadingMessages.value = true;
    messages.value = [];
    await loadDialogMeta();
    await loadMessages();
    await markDialogRead();
    messageInput.value?.focus();
  },
  { immediate: true }
);

onMounted(async () => {
  await loadDialogs();
});
</script>

<style scoped>
.my-dialogs-page {
  min-height: calc(100vh - 70px);
  background: #f5f5f5;
  padding: 1rem 0 1.5rem;
}

.container {
  max-width: 100%;
  margin: 0;
}

.page-header {
  margin-bottom: 0.75rem;
}

.page-header h1 {
  margin: 0;
  color: #333;
  font-size: 1.5rem;
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
}

.empty-dialogs {
  text-align: center;
  padding: 3rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.empty-dialogs p {
  margin: 0.5rem 0;
  color: #666;
}

.empty-hint {
  color: #999;
  font-size: 0.95rem;
}

.dialogs-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 1rem;
  height: calc(100vh - 185px);
  min-height: 520px;
}

.dialogs-sidebar,
.chat-main {
  background: #fff;
  border: 1px solid #e6e6e6;
  border-radius: 12px;
  overflow: hidden;
}

.dialogs-list {
  height: 100%;
  overflow-y: auto;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dialog-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.8rem;
  border-radius: 8px;
  border: 1px solid #ececec;
  text-decoration: none;
  color: inherit;
  transition: all 0.15s;
}

.dialog-item:hover {
  border-color: #c5cae9;
  background: #f8f9ff;
}

.dialog-item.active {
  border-color: #667eea;
  background: #eef0ff;
}

.dialog-info {
  flex: 1;
  min-width: 0;
}

.dialog-business-name {
  margin: 0;
  font-size: 0.96rem;
  color: #2f2f2f;
}

.dialog-last-message {
  margin: 0.35rem 0 0;
  color: #666;
  font-size: 0.85rem;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dialog-last-message.empty {
  color: #9a9a9a;
  font-style: italic;
}

.dialog-time {
  margin-top: 0.3rem;
  display: block;
  font-size: 0.75rem;
  color: #9c9c9c;
}

.dialog-meta {
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

.chat-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chat-header {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #ececec;
  flex-shrink: 0;
}

.chat-header h2 {
  margin: 0;
  font-size: 1.05rem;
  color: #333;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.loading-messages,
.empty-messages,
.empty-chat {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #777;
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
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #e8ecff;
  color: #3f51b5;
  font-size: 0.75rem;
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
  max-width: 72%;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.message-own .message-content {
  align-items: flex-end;
  order: 1;
}

.message-own .message-author-row {
  order: 2;
}

.message-author-name {
  font-size: 0.76rem;
  color: #7a7a7a;
  margin: 0 0 0.1rem 0.25rem;
}

.message-text {
  padding: 0.65rem 0.85rem;
  border-radius: 11px;
  margin: 0;
  word-wrap: break-word;
  background: #ececec;
  color: #333;
}

.message-own .message-text {
  background: #667eea;
  color: white;
}

.message-time {
  font-size: 0.72rem;
  color: #999;
  padding: 0 0.35rem;
}

.message-input-container {
  padding: 0.8rem 1rem;
  border-top: 1px solid #ececec;
  background: white;
  flex-shrink: 0;
}

.message-form {
  display: flex;
  gap: 0.5rem;
}

.message-input {
  flex: 1;
  padding: 0.65rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
}

.message-input:focus {
  outline: none;
  border-color: #667eea;
}

.send-button {
  padding: 0.65rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.send-button:hover:not(:disabled) {
  background: #5568d3;
}

.send-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 1024px) {
  .dialogs-layout {
    grid-template-columns: 1fr;
    height: auto;
    min-height: 0;
  }

  .dialogs-sidebar {
    max-height: 280px;
  }

  .chat-main {
    min-height: 420px;
  }
}
</style>
