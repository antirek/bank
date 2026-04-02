<template>
  <div class="business-chats-page">
    <div v-if="loading" class="loading">Загрузка...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>
    <div v-else-if="businesses.length === 0" class="empty-state">
      <p>У вас пока нет бизнесов</p>
    </div>

    <div
      v-else
      class="chats-split"
      :class="{ 'chats-split--stack': isMobileStack }"
      :style="{ '--chats-top-reserve': layoutTopReserve }"
    >
      <aside
        v-show="!isMobileStack || mobilePanel === 'businesses'"
        class="col col-businesses"
        aria-label="Бизнесы"
      >
        <div class="col-head">Бизнесы</div>
        <div class="col-scroll">
          <button
            v-for="b in businesses"
            :key="b.businessId"
            type="button"
            class="biz-row"
            :class="{ active: selectedBusinessId === b.businessId }"
            @click="selectBusiness(b.businessId)"
          >
            <span class="biz-name">{{ b.name || 'Без названия' }}</span>
            <span v-if="b.unreadDialogsCount > 0" class="unread-pill">{{ b.unreadDialogsCount }}</span>
          </button>
        </div>
      </aside>

      <aside
        v-show="!isMobileStack || mobilePanel === 'dialogs'"
        class="col col-dialogs"
        aria-label="Чаты с клиентами"
      >
        <div v-if="isMobileStack" class="col-head col-head--with-nav">
          <button type="button" class="mobile-back" @click="mobileBackToBusinesses">
            ←
          </button>
          <span class="col-head-title">Переписки</span>
        </div>
        <div v-else class="col-head">Переписки</div>
        <template v-if="!selectedBusinessId">
          <div class="col-placeholder">Выберите бизнес</div>
        </template>
        <template v-else>
          <div class="dialogs-search-wrap">
            <input
              v-model="searchQuery"
              type="search"
              class="dialogs-search"
              placeholder="Поиск по имени или телефону…"
              autocomplete="off"
            />
          </div>
          <div v-if="dialogsLoading" class="col-placeholder">Загрузка…</div>
          <div v-else-if="dialogsError" class="col-error">{{ dialogsError }}</div>
          <div v-else-if="filteredDialogs.length === 0" class="col-placeholder">Нет диалогов</div>
          <div v-else class="col-scroll">
            <button
              v-for="d in filteredDialogs"
              :key="d.dialogId"
              type="button"
              class="dialog-row"
              :class="{ active: selectedDialogId === d.dialogId }"
              @click="selectDialog(d.dialogId)"
            >
              <span class="dialog-avatar">{{ getUserInitials(d.userName) }}</span>
              <span class="dialog-body">
                <span class="dialog-line1">
                  <span class="dialog-user">{{ d.userName || 'Клиент' }}</span>
                  <span v-if="d.unreadCount > 0" class="unread-mini">{{ d.unreadCount }}</span>
                </span>
                <span class="dialog-preview">{{
                  d.lastMessage?.content || 'Нет сообщений'
                }}</span>
                <span class="dialog-time">{{ formatTime(d.lastMessageAt) }}</span>
              </span>
            </button>
          </div>
        </template>
      </aside>

      <main
        v-show="!isMobileStack || mobilePanel === 'thread'"
        class="col col-thread"
        aria-label="Переписка"
      >
        <template v-if="!selectedDialogId">
          <div class="thread-empty">Выберите чат слева</div>
        </template>
        <div v-else class="thread-wrap">
          <DialogView
            :key="selectedDialogId"
            :dialog-id="selectedDialogId"
            :back-url="dialogBackUrl"
            :show-embedded-back="isMobileStack"
            :pwa-safe-area="pwaSafeArea"
            embedded
            @embedded-back="onThreadEmbeddedBack"
          />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import api from '@boqq/api-client';
import DialogView from './DialogView.vue';

const props = defineProps({
  /** Базовый path для query business/dialog (профиль или owner-PWA «/»). */
  chatsBasePath: {
    type: String,
    default: '/my/profile/business-chats'
  },
  /** Куда ведёт «назад» из встроенного DialogView. */
  dialogBackUrl: {
    type: String,
    default: '/my/profile/business-chats'
  },
  /** Отступ сверху под шапку: CSS значение, напр. 260px или 52px. */
  layoutTopReserve: {
    type: String,
    default: '260px'
  },
  /** Safe-area у поля ввода в чате (owner-PWA). */
  pwaSafeArea: {
    type: Boolean,
    default: false
  }
});

const MOBILE_STACK_MQ = '(max-width: 720px)';

const route = useRoute();
const router = useRouter();

const authStore = useAuthStore();
const businesses = ref([]);
const loading = ref(true);
const error = ref('');

const selectedBusinessId = ref('');
const selectedDialogId = ref('');

const dialogs = ref([]);
const dialogsLoading = ref(false);
const dialogsError = ref('');
const searchQuery = ref('');

const isMobileStack = ref(false);
const mobilePanel = ref('businesses');

let mqListener = null;

function updateMobileStackFlag() {
  if (typeof window === 'undefined') return;
  isMobileStack.value = window.matchMedia(MOBILE_STACK_MQ).matches;
}

function syncMobilePanelFromRoute() {
  if (!isMobileStack.value) return;
  const b = String(route.query.business || '');
  const d = String(route.query.dialog || '');
  if (d && b) {
    mobilePanel.value = 'thread';
  } else if (b) {
    mobilePanel.value = 'dialogs';
  } else {
    mobilePanel.value = 'businesses';
  }
}

const filteredDialogs = computed(() => {
  if (!searchQuery.value.trim()) return dialogs.value;
  const q = searchQuery.value.toLowerCase().trim();
  return dialogs.value.filter((d) => {
    const name = String(d.userName || '').toLowerCase();
    const phone = String(d.userPhone || '').toLowerCase();
    return name.includes(q) || phone.includes(q);
  });
});

const getUserInitials = (name) => {
  if (!name || name === 'Без имени') return '??';
  return name
    .split(' ')
    .map((n) => n[0])
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

const refreshBusinessUnread = async (businessId) => {
  const b = businesses.value.find((x) => x.businessId === businessId);
  if (!b) return;
  try {
    const res = await api.get(`/businesses/${businessId}/dialogs`);
    const list = res.data.data || [];
    b.unreadDialogsCount = list.reduce((sum, d) => sum + (d.unreadCount || 0), 0);
  } catch {
    b.unreadDialogsCount = 0;
  }
};

const loadBusinesses = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await api.get('/businesses', {
      params: { ownerId: authStore.user?.userId }
    });
    businesses.value = response.data.data || [];
    await Promise.all(businesses.value.map((b) => refreshBusinessUnread(b.businessId)));
    const qBiz = String(route.query.business || '');
    if (businesses.value.length) {
      if (qBiz && businesses.value.some((x) => x.businessId === qBiz)) {
        selectedBusinessId.value = qBiz;
      } else {
        selectedBusinessId.value = businesses.value[0].businessId;
      }
    }
  } catch (err) {
    error.value = err.response?.data?.error || 'Ошибка при загрузке бизнес-чатов';
  } finally {
    loading.value = false;
  }
};

const loadDialogsForBusiness = async (businessId) => {
  if (!businessId) return;
  dialogsLoading.value = true;
  dialogsError.value = '';
  dialogs.value = [];
  try {
    const response = await api.get(`/businesses/${businessId}/dialogs`);
    dialogs.value = response.data.data || [];
  } catch (err) {
    dialogsError.value = err.response?.data?.error || 'Ошибка при загрузке диалогов';
  } finally {
    dialogsLoading.value = false;
  }
};

function selectBusiness(businessId) {
  selectedBusinessId.value = businessId;
  selectedDialogId.value = '';
  searchQuery.value = '';
  router.replace({
    path: props.chatsBasePath,
    query: { business: businessId }
  });
  if (isMobileStack.value) {
    mobilePanel.value = 'dialogs';
  }
}

function selectDialog(dialogId) {
  selectedDialogId.value = dialogId;
  router.replace({
    path: props.chatsBasePath,
    query: { business: selectedBusinessId.value, dialog: dialogId }
  });
  if (isMobileStack.value) {
    mobilePanel.value = 'thread';
  }
}

function mobileBackToBusinesses() {
  selectedBusinessId.value = '';
  selectedDialogId.value = '';
  searchQuery.value = '';
  router.replace({ path: props.chatsBasePath, query: {} });
  mobilePanel.value = 'businesses';
}

function onThreadEmbeddedBack() {
  selectedDialogId.value = '';
  router.replace({
    path: props.chatsBasePath,
    query: { business: selectedBusinessId.value }
  });
  if (isMobileStack.value) {
    mobilePanel.value = 'dialogs';
  }
}

watch(selectedBusinessId, async (id) => {
  if (!id) return;
  await loadDialogsForBusiness(id);
  const qDlg = String(route.query.dialog || '');
  if (qDlg && dialogs.value.some((d) => d.dialogId === qDlg)) {
    selectedDialogId.value = qDlg;
  } else {
    selectedDialogId.value = '';
  }
});

watch(selectedDialogId, (id) => {
  if (id && selectedBusinessId.value) {
    refreshBusinessUnread(selectedBusinessId.value);
  }
});

watch(isMobileStack, () => {
  syncMobilePanelFromRoute();
});

watch(
  () => route.query,
  () => {
    syncMobilePanelFromRoute();
  },
  { deep: true }
);

onMounted(() => {
  updateMobileStackFlag();
  syncMobilePanelFromRoute();
  mqListener = () => {
    updateMobileStackFlag();
    syncMobilePanelFromRoute();
  };
  if (typeof window !== 'undefined') {
    window.matchMedia(MOBILE_STACK_MQ).addEventListener('change', mqListener);
  }
  loadBusinesses();
});

onUnmounted(() => {
  if (typeof window !== 'undefined' && mqListener) {
    window.matchMedia(MOBILE_STACK_MQ).removeEventListener('change', mqListener);
  }
});
</script>

<style scoped>
.business-chats-page {
  min-height: 0;
  background: transparent;
  padding: 0;
}

.loading {
  text-align: center;
  padding: 2rem;color: #666;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #ececec;
}

.chats-split {
  display: grid;
  grid-template-columns: 1fr 3fr 8fr;
  gap: 0.65rem;
  height: calc(100vh - var(--chats-top-reserve, 260px));
  max-height: calc(100vh - var(--chats-top-reserve, 260px));
  min-height: 280px;
  align-items: stretch;
}

.col {
  background: #fff;
  border: 1px solid #e6e6e6;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

.col-head {
  padding: 0.55rem 0.75rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: #555;
  border-bottom: 1px solid #ececec;
  flex-shrink: 0;
}

.col-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 0.35rem;
}

.col-placeholder,
.thread-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  font-size: 0.92rem;
  padding: 1rem;
}

.col-error {
  padding: 0.75rem;
  color: #c62828;
  font-size: 0.88rem;
}

.biz-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem;
  padding: 0.55rem 0.5rem;
  margin-bottom: 0.2rem;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font: inherit;
  color: #333;
}

.biz-row:hover {
  background: #f5f6ff;
}

.biz-row.active {
  border-color: #667eea;
  background: #eef0ff;
}

.biz-name {
  font-size: 0.88rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unread-pill {
  flex-shrink: 0;
  background: #667eea;
  color: #fff;
  border-radius: 999px;
  min-width: 20px;
  height: 20px;
  padding: 0 0.3rem;
  font-size: 0.68rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.dialogs-search-wrap {
  padding: 0.4rem 0.5rem 0.35rem;
  flex-shrink: 0;
}

.dialogs-search {
  width: 100%;
  box-sizing: border-box;
  padding: 0.45rem 0.55rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.85rem;
}

.dialogs-search:focus {
  outline: none;
  border-color: #667eea;
}

.dialog-row {
  width: 100%;
  display: flex;
  gap: 0.45rem;
  align-items: flex-start;
  padding: 0.45rem 0.35rem;
  margin-bottom: 0.15rem;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font: inherit;
  color: inherit;
}

.dialog-row:hover {
  background: #f8f9fa;
}

.dialog-row.active {
  border-color: #667eea;
  background: #eef0ff;
}

.dialog-avatar {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.dialog-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
}

.dialog-line1 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem;
}

.dialog-user {
  font-size: 0.86rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unread-mini {
  flex-shrink: 0;
  background: #667eea;
  color: #fff;
  border-radius: 8px;
  padding: 0.1rem 0.35rem;
  font-size: 0.65rem;
  font-weight: 700;
}

.dialog-preview {
  font-size: 0.78rem;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dialog-time {
  font-size: 0.7rem;
  color: #9a9a9a;
}

.col-thread {
  position: relative;
  min-height: 0;
}

.thread-wrap {
  flex: 1;
  min-height: 0;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chats-split--stack {
  grid-template-columns: 1fr;
  height: calc(
    100vh - var(--chats-top-reserve, 260px) - env(safe-area-inset-bottom, 0px)
  );
  max-height: calc(
    100vh - var(--chats-top-reserve, 260px) - env(safe-area-inset-bottom, 0px)
  );
}

.chats-split--stack .col {
  min-height: 0;
}

.col-head--with-nav {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.col-head-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: #555;
}

.mobile-back {
  flex-shrink: 0;
  border: none;
  background: none;
  color: #667eea;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0.1rem 0.35rem;
  line-height: 1;
}

@media (max-width: 1100px) {
  .chats-split:not(.chats-split--stack) {
    grid-template-columns: 1fr;
    height: auto;
    max-height: none;
    min-height: 0;
  }

  .chats-split:not(.chats-split--stack) .col-businesses .col-scroll {
    max-height: 200px;
  }

  .chats-split:not(.chats-split--stack) .col-dialogs .col-scroll {
    max-height: 240px;
  }

  .chats-split:not(.chats-split--stack) .col-thread {
    min-height: min(55vh, 480px);
    max-height: min(65vh, 560px);
  }
}
</style>
