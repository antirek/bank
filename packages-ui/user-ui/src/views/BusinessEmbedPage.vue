<template>
  <div class="embed-widget">
    <div v-if="loading" class="embed-state">Загрузка…</div>
    <div v-else-if="error" class="embed-state embed-state--error">{{ error }}</div>
    <template v-else-if="business">
      <header class="embed-header">
        <div class="embed-header-business">
          <img
            v-if="displayLogo"
            :src="displayLogo"
            alt=""
            class="embed-logo"
            width="40"
            height="40"
            loading="lazy"
          />
          <div class="embed-header-text">
            <h1 class="embed-title">{{ business.name }}</h1>
          </div>
        </div>
        <div v-if="showHeaderUser" class="embed-header-user">
          <img
            v-if="currentUserAvatar"
            :src="currentUserAvatar"
            alt=""
            class="embed-user-avatar"
            width="36"
            height="36"
            loading="lazy"
          />
          <div v-else class="embed-user-avatar embed-user-avatar--ph" aria-hidden="true">
            {{ headerUserInitials }}
          </div>
          <span class="embed-user-name">{{ headerUserDisplayName }}</span>
        </div>
      </header>

      <div class="embed-body">
        <template v-if="authStore.isRestoring">
          <p class="embed-state">Проверка сессии…</p>
        </template>
        <template v-else-if="isOwner">
          <p class="embed-hint">Это ваша карточка. Переписки с клиентами — в разделе «Обращения».</p>
          <a
            class="btn btn-primary embed-btn"
            :href="businessChatsUrl"
            target="_blank"
            rel="noopener noreferrer"
          >Открыть обращения</a>
        </template>
        <template v-else-if="!authStore.isAuthenticated">
          <p class="embed-hint">Войдите, чтобы написать бизнесу. Новый аккаунт — через ссылку «Регистрация» (откроется отдельная вкладка).</p>
          <div class="embed-auth-actions">
            <a class="btn btn-primary embed-btn" :href="loginReturnUrl">Войти</a>
            <a
              class="embed-link-secondary"
              :href="loginReturnUrl"
              target="_blank"
              rel="noopener noreferrer"
            >Регистрация</a>
          </div>
        </template>
        <template v-else>
          <div v-if="chatTabError" class="embed-state embed-state--error">{{ chatTabError }}</div>
          <div v-else-if="chatTabLoading" class="embed-state">Загрузка чата…</div>
          <div v-else-if="clientDialogId" class="embed-chat-wrap">
            <DialogView :dialog-id="String(clientDialogId)" :embedded="true" />
          </div>
        </template>
      </div>

      <footer class="embed-footer">
        <a :href="poweredByHref" class="embed-powered" target="_blank" rel="noopener noreferrer">Powered by Boqq</a>
      </footer>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import api from '@boqq/api-client';
import DialogView from './DialogView.vue';

const route = useRoute();
const authStore = useAuthStore();

const authUiUrl = (import.meta.env.VITE_AUTH_UI_URL || 'http://localhost:5174').replace(/\/$/, '');

const business = ref(null);
const loading = ref(true);
const error = ref('');
const clientDialogId = ref('');
const chatDialogBusinessId = ref('');
const chatTabLoading = ref(false);
const chatTabError = ref('');

const embedPageUrl = computed(() => {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}${window.location.pathname}`;
});

const loginReturnUrl = computed(() => {
  const ret = encodeURIComponent(embedPageUrl.value);
  return `${authUiUrl}/?return=${ret}`;
});

const poweredByHref = computed(() => {
  if (typeof window === 'undefined') return '/';
  return new URL('/', window.location.origin).href;
});

const businessChatsUrl = computed(() => {
  if (!business.value?.businessId || typeof window === 'undefined') return '/my/profile/business-chats';
  const u = new URL('/my/profile/business-chats', window.location.origin);
  u.searchParams.set('business', business.value.businessId);
  return u.href;
});

const isOwner = computed(() => {
  if (authStore.isRestoring || !authStore.isAuthenticated || !business.value || !authStore.user) {
    return false;
  }
  return business.value.ownerId === authStore.user.userId;
});

const displayLogo = computed(() => {
  const b = business.value;
  if (!b) return '';
  const fromDoc = (b.logo || '').trim();
  if (fromDoc) return fromDoc;
  const hero = b.card?.sections?.find((s) => s.type === 'hero');
  return (hero?.data?.logo || '').trim();
});

const showHeaderUser = computed(
  () => Boolean(authStore.isAuthenticated && authStore.user && !authStore.isRestoring)
);

const currentUserAvatar = computed(() => (authStore.user?.avatar || '').trim());

const headerUserDisplayName = computed(() => {
  const u = authStore.user;
  if (!u) return '';
  const name = (u.name || '').trim();
  if (name) return name;
  const phone = (u.phone || '').trim();
  if (phone) return phone;
  return 'Вы';
});

const headerUserInitials = computed(() => {
  const u = authStore.user;
  if (!u) return '?';
  const n = (u.name || '').trim();
  if (n.length >= 2) return n.slice(0, 2).toUpperCase();
  if (n.length === 1) return n.toUpperCase();
  const digits = (u.phone || '').replace(/\D/g, '');
  if (digits.length >= 2) return digits.slice(-2);
  return '?';
});

function resetChatState() {
  clientDialogId.value = '';
  chatDialogBusinessId.value = '';
  chatTabError.value = '';
  chatTabLoading.value = false;
}

function shouldLoadClientChat() {
  if (!authStore.isAuthenticated || authStore.isRestoring || !business.value || !authStore.user) return false;
  return business.value.ownerId !== authStore.user.userId;
}

async function loadClientDialog() {
  if (!shouldLoadClientChat()) return;
  const bid = business.value.businessId;
  if (clientDialogId.value && chatDialogBusinessId.value === bid) return;

  chatTabLoading.value = true;
  chatTabError.value = '';

  try {
    const response = await api.get('/dialogs/me', { params: { limit: 100 } });
    const dialogs = response.data.data || [];
    const existing = dialogs.find((d) => d.businessId === bid);
    if (existing) {
      clientDialogId.value = existing.dialogId;
      chatDialogBusinessId.value = bid;
      return;
    }
    const startRes = await api.post(`/businesses/${bid}/dialogs/start`);
    clientDialogId.value = startRes.data.data.dialogId;
    chatDialogBusinessId.value = bid;
  } catch (err) {
    if (err.response?.status === 401) {
      return;
    }
    chatTabError.value = err.response?.data?.error || err.message || 'Не удалось открыть чат';
    clientDialogId.value = '';
    chatDialogBusinessId.value = '';
  } finally {
    chatTabLoading.value = false;
  }
}

async function loadBusiness() {
  loading.value = true;
  error.value = '';
  resetChatState();
  try {
    const response = await api.get(`/businesses/slug/${route.params.slug}`);
    business.value = response.data.data;
  } catch (err) {
    error.value = err.response?.data?.error || 'Бизнес не найден';
    business.value = null;
  } finally {
    loading.value = false;
    if (shouldLoadClientChat()) {
      loadClientDialog();
    }
  }
}

watch(
  () => authStore.isAuthenticated,
  (ok) => {
    if (!ok) {
      resetChatState();
    } else if (shouldLoadClientChat()) {
      loadClientDialog();
    }
  }
);

watch(
  () => authStore.user?.userId,
  () => {
    if (shouldLoadClientChat()) {
      loadClientDialog();
    }
  }
);

watch(
  () => authStore.isRestoring,
  (r) => {
    if (!r && shouldLoadClientChat()) {
      loadClientDialog();
    }
  }
);

onMounted(() => {
  loadBusiness();
});

watch(
  () => route.params.slug,
  () => {
    loadBusiness();
  }
);
</script>

<style scoped>
.embed-widget {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #fff;
  font-size: 0.9375rem;
  color: #333;
}

.embed-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.embed-header-business {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  flex: 1;
}

.embed-header-user {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-shrink: 0;
  max-width: 45%;
}

.embed-user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.embed-user-avatar--ph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1;
  box-sizing: border-box;
}

.embed-user-name {
  font-size: 0.84rem;
  font-weight: 600;
  color: #424242;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.embed-logo {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.embed-header-text {
  min-width: 0;
}

.embed-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.25;
  word-break: break-word;
}

.embed-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0.75rem 1rem;
}

.embed-hint {
  margin: 0 0 1rem 0;
  color: #555;
  line-height: 1.45;
  font-size: 0.9rem;
}

.embed-auth-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1rem;
}

.embed-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  padding: 0.55rem 1.1rem;
  border-radius: 8px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
}

.btn-primary {
  background: #667eea;
  color: #fff;
}

.btn-primary:hover {
  background: #5568d3;
}

.embed-link-secondary {
  color: #667eea;
  font-size: 0.9rem;
  font-weight: 500;
}

.embed-chat-wrap {
  flex: 1;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  border: 1px solid #e2e4ed;
  border-radius: 12px;
  overflow: hidden;
}

.embed-state {
  margin: 0;
  padding: 1rem 0;
  color: #666;
  text-align: center;
}

.embed-state--error {
  color: #c62828;
  background: #ffebee;
  padding: 0.75rem;
  border-radius: 8px;
  text-align: left;
}

.embed-footer {
  flex-shrink: 0;
  padding: 0.5rem 1rem 0.65rem;
  border-top: 1px solid #eee;
  text-align: center;
}

.embed-powered {
  font-size: 0.75rem;
  color: #888;
  text-decoration: none;
}

.embed-powered:hover {
  color: #667eea;
  text-decoration: underline;
}
</style>
