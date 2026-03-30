<template>
  <div class="business-page">
    <div class="container">
      <div v-if="loading" class="loading">
        Загрузка...
      </div>

      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-else-if="business" :class="['business-content', { 'business-content--chat': activeTab === 'chat' }]">
        <div class="business-header-section">
          <div class="header-top-row">
            <div class="header-brand">
              <img
                v-if="displayLogo"
                :src="displayLogo"
                :alt="businessLogoAlt"
                class="business-logo"
                width="88"
                height="88"
                loading="lazy"
                decoding="async"
              />
              <div class="header-titles">
                <h1>{{ business.name }}</h1>
                <p class="slug">/b/{{ business.slug }}</p>
              </div>
            </div>
            <div class="header-actions">
              <button
                v-if="sharePageUrl"
                type="button"
                class="btn btn-secondary btn-icon-header"
                title="QR-код со ссылкой на эту страницу"
                aria-label="Показать QR-код со ссылкой на карточку бизнеса"
                @click="openQrModal"
              >
                <span class="action-icon action-icon--svg" aria-hidden="true">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75zM16.5 19.5h.75v.75h-.75v-.75z"
                    />
                  </svg>
                </span>
              </button>
              <router-link
                v-if="authStore.isAuthenticated && isOwner"
                :to="{ path: '/my/profile/business-chats', query: { business: business.businessId } }"
                class="btn btn-primary btn-icon-header"
                title="Обращения"
                aria-label="Обращения"
              >
                <span class="action-icon" aria-hidden="true">📨</span>
              </router-link>
              <button
                v-else-if="authStore.isAuthenticated && !isOwner"
                type="button"
                class="btn btn-primary btn-icon-header"
                :disabled="startingDialog"
                :title="startingDialog ? 'Открытие диалога…' : 'Начать диалог'"
                :aria-label="startingDialog ? 'Открытие диалога…' : 'Начать диалог'"
                @click="handleStartDialog"
              >
                <span class="action-icon" aria-hidden="true">{{ startingDialog ? '⏳' : '💬' }}</span>
              </button>
              <button
                v-if="authStore.isAuthenticated && !isOwner && !isSubscribed"
                type="button"
                class="btn btn-secondary btn-icon-header"
                :disabled="subscribing"
                :title="subscribing ? 'Оформление подписки…' : 'Подписаться'"
                :aria-label="subscribing ? 'Оформление подписки…' : 'Подписаться'"
                @click="handleSubscribe"
              >
                <span class="action-icon" aria-hidden="true">{{ subscribing ? '⏳' : '➕' }}</span>
              </button>
              <span
                v-else-if="authStore.isAuthenticated && !isOwner && isSubscribed"
                class="subscribed-icon-badge"
                title="Вы подписаны"
                role="status"
                aria-label="Вы подписаны"
              >
                <span class="action-icon action-icon--subscribed" aria-hidden="true">✓</span>
              </span>
              <a
                v-if="!authStore.isAuthenticated"
                :href="authUiUrl"
                class="btn btn-primary btn-icon-header"
                title="Войти"
                aria-label="Войти"
              >
                <span class="action-icon" aria-hidden="true">🔑</span>
              </a>
            </div>
          </div>
          <p v-if="business.description" class="description">
            {{ business.description }}
          </p>
        </div>

        <div class="business-tabs" role="tablist" aria-label="Разделы страницы бизнеса">
          <button
            id="tab-news"
            type="button"
            class="tab-btn"
            role="tab"
            :aria-selected="activeTab === 'news'"
            :tabindex="activeTab === 'news' ? 0 : -1"
            @click="activeTab = 'news'"
          >
            Новости
          </button>
          <button
            id="tab-info"
            type="button"
            class="tab-btn"
            role="tab"
            :aria-selected="activeTab === 'info'"
            :tabindex="activeTab === 'info' ? 0 : -1"
            @click="activeTab = 'info'"
          >
            Инфо
          </button>
          <button
            id="tab-chat"
            type="button"
            class="tab-btn"
            role="tab"
            :aria-selected="activeTab === 'chat'"
            :aria-disabled="!authStore.isAuthenticated"
            :disabled="!authStore.isAuthenticated"
            :tabindex="activeTab === 'chat' ? 0 : -1"
            :title="!authStore.isAuthenticated ? 'Войдите, чтобы открыть чат' : undefined"
            @click="selectChatTab"
          >
            Чат
          </button>
        </div>

        <div
          id="panel-info"
          v-show="activeTab === 'info'"
          class="tab-panel"
          role="tabpanel"
          aria-labelledby="tab-info"
          :aria-hidden="activeTab !== 'info'"
        >
          <div v-if="infoSectionsForDisplay.length" class="card-sections">
            <section v-for="section in infoSectionsForDisplay" :key="section.id" :class="sectionCardClass(section.type)">
              <h3>{{ sectionTitle(section.type) }}</h3>
              <template v-if="section.type === 'address'">
                <p>{{ section.data.address }}</p>
              </template>
              <template v-else-if="section.type === 'contacts'">
                <p v-if="section.data.email">Email: {{ section.data.email }}</p>
                <p v-if="section.data.website">
                  Сайт: <a :href="section.data.website" target="_blank" rel="noopener noreferrer">{{ section.data.website }}</a>
                </p>
                <ul v-if="section.data.phones?.length">
                  <li v-for="phone in section.data.phones" :key="phone">{{ phone }}</li>
                </ul>
              </template>
              <template v-else-if="section.type === 'messengers' && hasMessengersSection(section.data)">
                <ul class="messengers-list">
                  <li v-if="section.data.telegram?.trim()">
                    Telegram:
                    <a
                      :href="messengerHref('telegram', section.data.telegram)"
                      target="_blank"
                      rel="noopener noreferrer"
                      >{{ section.data.telegram.trim() }}</a
                    >
                  </li>
                  <li v-if="section.data.whatsapp?.trim()">
                    WhatsApp:
                    <a
                      :href="messengerHref('whatsapp', section.data.whatsapp)"
                      target="_blank"
                      rel="noopener noreferrer"
                      >{{ section.data.whatsapp.trim() }}</a
                    >
                  </li>
                  <li v-if="section.data.vk?.trim()">
                    ВКонтакте:
                    <a
                      :href="messengerHref('vk', section.data.vk)"
                      target="_blank"
                      rel="noopener noreferrer"
                      >{{ section.data.vk.trim() }}</a
                    >
                  </li>
                  <li v-if="section.data.max?.trim()">
                    Max:
                    <a
                      :href="messengerHref('max', section.data.max)"
                      target="_blank"
                      rel="noopener noreferrer"
                      >{{ section.data.max.trim() }}</a
                    >
                  </li>
                </ul>
              </template>
              <template v-else-if="section.type === 'working_hours'">
                <ul class="hours-list">
                  <li v-for="day in dayKeys" :key="day">
                    <strong>{{ dayNames[day] }}:</strong>
                    <span v-if="section.data[day]?.enabled">{{ section.data[day].from }}-{{ section.data[day].to }}</span>
                    <span v-else>выходной</span>
                  </li>
                </ul>
              </template>
              <template v-else-if="section.type === 'gallery'">
                <div class="gallery-grid">
                  <img v-for="img in galleryImages(section)" :key="img" :src="img" alt="Фото бизнеса" />
                </div>
              </template>
            </section>
          </div>
          <p v-else class="tab-panel-empty">В карточке пока нет блоков для отображения.</p>
        </div>

        <div
          id="panel-news"
          v-show="activeTab === 'news'"
          class="tab-panel"
          role="tabpanel"
          aria-labelledby="tab-news"
          :aria-hidden="activeTab !== 'news'"
        >
          <div class="news-section">
            <div class="news-header">
              <h2 class="news-heading">Новости</h2>
              <button
                v-if="authStore.isAuthenticated && isOwner"
                type="button"
                class="btn btn-primary btn-add-news"
                @click="showAddNewsForm = !showAddNewsForm"
              >
                {{ showAddNewsForm ? 'Отмена' : '+ Добавить новость' }}
              </button>
            </div>

            <div v-if="showAddNewsForm && isOwner" class="add-news-form">
              <form @submit.prevent="handleAddNews">
                <div class="form-group">
                  <label for="news-title">Заголовок</label>
                  <input
                    id="news-title"
                    v-model="newNews.title"
                    type="text"
                    placeholder="Введите заголовок новости"
                    required
                  />
                </div>
                <div class="form-group">
                  <label for="news-content">Текст новости</label>
                  <textarea
                    id="news-content"
                    v-model="newNews.content"
                    placeholder="Введите текст новости"
                    rows="5"
                    required
                  ></textarea>
                </div>
                <div class="form-actions">
                  <button type="submit" class="btn btn-primary" :disabled="addingNews">
                    {{ addingNews ? 'Сохранение...' : 'Сохранить' }}
                  </button>
                  <button type="button" class="btn btn-secondary" @click="cancelAddNews">
                    Отмена
                  </button>
                </div>
              </form>
            </div>

            <div v-if="newsLoading" class="loading-small">
              Загрузка новостей...
            </div>
            <div v-else-if="news.length === 0" class="no-news">
              Новостей пока нет
            </div>
            <div v-else class="news-list">
              <div v-for="item in news" :key="item.newsId" class="news-item">
                <div class="news-item-header">
                  <h3>{{ item.title }}</h3>
                  <span class="news-date">{{ formatDate(item.createdAt) }}</span>
                </div>
                <p class="news-content">{{ item.content }}</p>
              </div>
            </div>
          </div>
        </div>

        <div
          id="panel-chat"
          v-show="activeTab === 'chat'"
          class="tab-panel tab-panel--chat"
          role="tabpanel"
          aria-labelledby="tab-chat"
          :aria-hidden="activeTab !== 'chat'"
        >
          <template v-if="authStore.isAuthenticated && isOwner">
            <div class="tab-chat-owner-hint">
              <p class="tab-chat-owner-text">
                Это ваша карточка. Переписки с клиентами собраны в разделе «Обращения».
              </p>
              <router-link
                :to="{ path: '/my/profile/business-chats', query: { business: business.businessId } }"
                class="btn btn-primary"
              >
                Открыть обращения
              </router-link>
            </div>
          </template>
          <template v-else-if="authStore.isAuthenticated && !isOwner">
            <div v-if="chatTabError" class="error-message tab-chat-error">{{ chatTabError }}</div>
            <div v-else-if="chatTabLoading" class="loading-small">Загрузка чата…</div>
            <div v-else-if="clientDialogId" class="tab-panel-chat-inner">
              <DialogView :dialog-id="String(clientDialogId)" :embedded="true" />
            </div>
          </template>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showQrModal"
        class="qr-modal-backdrop"
        role="presentation"
        @click.self="closeQrModal"
      >
        <div
          class="qr-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="qr-modal-title"
          @click.stop
        >
          <button
            type="button"
            class="qr-modal-close"
            aria-label="Закрыть"
            @click="closeQrModal"
          >
            ×
          </button>
          <h2 id="qr-modal-title" class="qr-modal-title">Ссылка на карточку</h2>
          <p class="qr-modal-hint">Отсканируйте QR-код, чтобы открыть эту страницу на телефоне.</p>
          <a v-if="sharePageUrl" :href="sharePageUrl" class="qr-modal-url" @click.stop>{{ sharePageUrl }}</a>
          <div class="qr-modal-image-wrap">
            <img
              v-if="qrDataUrl"
              :src="qrDataUrl"
              width="220"
              height="220"
              class="qr-modal-image"
              alt="QR-код со ссылкой на страницу бизнеса"
            />
            <p v-else-if="qrError" class="qr-modal-error">{{ qrError }}</p>
            <p v-else class="qr-modal-loading">Генерация…</p>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import QRCode from 'qrcode';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import api from '@boqq/api-client';
import DialogView from './DialogView.vue';

const route = useRoute();
const authStore = useAuthStore();
const authUiUrl = import.meta.env.VITE_AUTH_UI_URL || 'http://localhost:5174';
const business = ref(null);
const news = ref([]);
/** Вкладка контента: по умолчанию задаётся после загрузки новостей. */
const activeTab = ref('info');
const loading = ref(true);
const error = ref('');
const subscribing = ref(false);
const isSubscribed = ref(false);
const startingDialog = ref(false);
/** Диалог клиента с этим бизнесом для вкладки «Чат». */
const clientDialogId = ref('');
const chatDialogBusinessId = ref('');
const chatTabLoading = ref(false);
const chatTabError = ref('');
const newsLoading = ref(false);
const showAddNewsForm = ref(false);
const addingNews = ref(false);
const newNews = ref({
  title: '',
  content: ''
});

const showQrModal = ref(false);
const qrDataUrl = ref('');
const qrError = ref('');

const sharePageUrl = computed(() => {
  if (!business.value?.slug || typeof window === 'undefined') {
    return '';
  }
  return new URL(`/b/${business.value.slug}`, window.location.origin).href;
});

function onQrModalEscape(e) {
  if (e.key === 'Escape' && showQrModal.value) {
    closeQrModal();
  }
}

watch(showQrModal, (open) => {
  if (open) {
    document.addEventListener('keydown', onQrModalEscape);
    document.body.style.overflow = 'hidden';
  } else {
    document.removeEventListener('keydown', onQrModalEscape);
    document.body.style.overflow = '';
  }
});

async function openQrModal() {
  if (!sharePageUrl.value) {
    return;
  }
  qrError.value = '';
  qrDataUrl.value = '';
  showQrModal.value = true;
  try {
    qrDataUrl.value = await QRCode.toDataURL(sharePageUrl.value, {
      width: 220,
      margin: 2,
      color: { dark: '#1a1a1a', light: '#ffffff' }
    });
  } catch {
    qrError.value = 'Не удалось создать QR-код';
  }
}

function closeQrModal() {
  showQrModal.value = false;
}
const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const dayNames = { mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Вс' };

/** Две пары блоков по 50 % ширины на широком экране (если обе секции пары видны). */
const HALF_PAIRS = [
  ['address', 'messengers'],
  ['contacts', 'working_hours']
];

// Проверяем, является ли текущий пользователь владельцем бизнеса
const isOwner = computed(() => {
  // Ждем, пока пользователь загрузится (если идет восстановление)
  if (authStore.isRestoring) {
    return false;
  }
  if (!authStore.isAuthenticated || !business.value || !authStore.user) {
    return false;
  }
  return business.value.ownerId === authStore.user.userId;
});

const fallbackSections = computed(() => {
  if (!business.value) return [];
  const c = business.value.contacts || { phones: [], email: '', website: '', messengers: {} };
  const m = c.messengers || {};
  return [
    { id: 'address', type: 'address', enabled: !!business.value.address, order: 0, data: { address: business.value.address || business.value.location?.address || '' } },
    {
      id: 'contacts',
      type: 'contacts',
      enabled: true,
      order: 1,
      data: { phones: c.phones || [], email: c.email || '', website: c.website || '' }
    },
    {
      id: 'messengers',
      type: 'messengers',
      enabled: !!(m.telegram || m.whatsapp || m.vk || m.max),
      order: 2,
      data: {
        telegram: m.telegram || '',
        whatsapp: m.whatsapp || '',
        vk: m.vk || '',
        max: m.max || ''
      }
    },
    { id: 'working_hours', type: 'working_hours', enabled: true, order: 3, data: business.value.workingHours || {} },
    { id: 'gallery', type: 'gallery', enabled: Array.isArray(business.value.gallery) && business.value.gallery.length > 0, order: 4, data: { images: business.value.gallery || [] } }
  ];
});

const displayLogo = computed(() => {
  const b = business.value;
  if (!b) return '';
  const fromDoc = (b.logo || '').trim();
  if (fromDoc) return fromDoc;
  const hero = b.card?.sections?.find((s) => s.type === 'hero');
  return (hero?.data?.logo || '').trim();
});

const businessLogoAlt = computed(() => {
  const name = business.value?.name?.trim();
  return name ? `Логотип: ${name}` : 'Логотип бизнеса';
});

const renderedSections = computed(() => {
  const sections = business.value?.card?.sections?.length ? business.value.card.sections : fallbackSections.value;
  return sections
    .filter((s) => s.enabled && s.type !== 'hero')
    .sort((a, b) => a.order - b.order);
});

/**
 * Порядок для сетки: каждая пара (адрес+мессенджеры, контакты+время работы) идёт подряд;
 * порядок пар — как первая секция пары встречается в карточке (по order).
 */
const sectionsForDisplay = computed(() => {
  const list = renderedSections.value;
  const sorted = [...list].sort((a, b) => a.order - b.order);
  const byType = new Map(list.map((s) => [s.type, s]));
  const used = new Set();
  const out = [];
  const pairForType = (type) => HALF_PAIRS.find((p) => p.includes(type));

  for (const s of sorted) {
    if (used.has(s.type)) continue;
    const pair = pairForType(s.type);
    if (pair) {
      const block = pair
        .map((t) => byType.get(t))
        .filter(Boolean)
        .sort((a, b) => a.order - b.order);
      for (const b of block) {
        used.add(b.type);
        out.push(b);
      }
    } else {
      used.add(s.type);
      out.push(s);
    }
  }
  return out;
});

/** Скрываем пустую секцию «Мессенджеры», чтобы не оставался заголовок без строк. */
const infoSectionsForDisplay = computed(() =>
  sectionsForDisplay.value.filter(
    (s) => s.type !== 'messengers' || hasMessengersSection(s.data)
  )
);

function sectionCardClass(type) {
  const base = 'section-card';
  const pair = HALF_PAIRS.find((p) => p.includes(type));
  if (!pair) {
    return `${base} section-card--wide`;
  }
  const visibleTypes = new Set(infoSectionsForDisplay.value.map((s) => s.type));
  const bothPresent = pair.every((t) => visibleTypes.has(t));
  if (bothPresent) {
    return `${base} section-card--half`;
  }
  return `${base} section-card--wide`;
}

const sectionTitle = (type) => ({
  address: 'Адрес',
  contacts: 'Контакты',
  messengers: 'Мессенджеры',
  working_hours: 'Время работы',
  gallery: 'Галерея',
  hero: 'Основное'
}[type] || type);

function hasMessengersSection(data) {
  return !!(
    data?.telegram?.trim() ||
    data?.whatsapp?.trim() ||
    data?.vk?.trim() ||
    data?.max?.trim()
  );
}

function messengerHref(kind, raw) {
  const s = String(raw || '').trim();
  if (!s) return '#';
  if (/^https?:\/\//i.test(s)) return s;
  if (kind === 'telegram') {
    const u = s.replace(/^@/, '');
    return `https://t.me/${encodeURIComponent(u)}`;
  }
  if (kind === 'whatsapp') {
    const digits = s.replace(/\D/g, '');
    if (digits.length >= 10) return `https://wa.me/${digits}`;
    return `https://wa.me/${encodeURIComponent(s)}`;
  }
  if (kind === 'vk') {
    if (s.includes('vk.com') || s.includes('vkontakte.ru')) return s.startsWith('http') ? s : `https://${s}`;
    return `https://vk.com/${encodeURIComponent(s.replace(/^\//, ''))}`;
  }
  return s.startsWith('http') ? s : `https://${s}`;
}

const galleryImages = (section) => section.data?.images || [];

function applyDefaultTab() {
  if (activeTab.value === 'chat') {
    return;
  }
  activeTab.value = news.value.length > 0 ? 'news' : 'info';
}

function resetChatTabState() {
  clientDialogId.value = '';
  chatDialogBusinessId.value = '';
  chatTabError.value = '';
  chatTabLoading.value = false;
}

async function loadClientDialogForChatTab() {
  if (!authStore.isAuthenticated || !business.value || isOwner.value) {
    return;
  }
  const bid = business.value.businessId;
  if (clientDialogId.value && chatDialogBusinessId.value === bid) {
    return;
  }

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
    chatTabError.value =
      err.response?.data?.error || err.message || 'Не удалось открыть чат';
    clientDialogId.value = '';
    chatDialogBusinessId.value = '';
  } finally {
    chatTabLoading.value = false;
  }
}

function selectChatTab() {
  if (!authStore.isAuthenticated) {
    return;
  }
  activeTab.value = 'chat';
  if (!isOwner.value) {
    loadClientDialogForChatTab();
  }
}

watch(
  () => authStore.isAuthenticated,
  (auth) => {
    if (!auth) {
      resetChatTabState();
      if (activeTab.value === 'chat') {
        activeTab.value = 'info';
      }
    }
  }
);

const loadBusiness = async () => {
  loading.value = true;
  error.value = '';
  resetChatTabState();

  try {
    const response = await api.get(`/businesses/slug/${route.params.slug}`);
    business.value = response.data.data;

    // Проверяем подписку, если пользователь авторизован
    if (authStore.isAuthenticated) {
      await checkSubscription();
    }
    
    // Загружаем новости
    await loadNews();
  } catch (err) {
    error.value = err.response?.data?.error || 'Бизнес не найден';
  } finally {
    loading.value = false;
  }
};

const checkSubscription = async () => {
  try {
    const response = await api.get('/me/subscriptions');
    const subscriptions = response.data.data.subscriptions || [];
    isSubscribed.value = subscriptions.some(sub => sub.businessId === business.value.businessId);
  } catch (err) {
    if (err.response?.status === 401) return; // токен истёк — уже обработано глобально
    console.error('Failed to check subscription:', err);
  }
};

const handleSubscribe = async () => {
  if (!authStore.isAuthenticated) {
    return;
  }

  subscribing.value = true;
  
  try {
    await api.post(`/businesses/${business.value.businessId}/subscribe`);
    isSubscribed.value = true;
    alert('Вы успешно подписались на бизнес!');
  } catch (err) {
    if (err.response?.status === 401) return; // сессия истекла, обработано глобально
    alert(err.response?.data?.error || 'Ошибка при подписке');
  } finally {
    subscribing.value = false;
  }
};

const handleStartDialog = async () => {
  if (!authStore.isAuthenticated || isOwner.value) {
    return;
  }

  startingDialog.value = true;
  activeTab.value = 'chat';

  try {
    await loadClientDialogForChatTab();
    if (chatTabError.value) {
      alert(chatTabError.value);
    }
  } catch (err) {
    const errorMessage = err.response?.data?.error || err.message || 'Ошибка при создании диалога';
    alert(errorMessage);
    console.error('Error starting dialog:', err);
  } finally {
    startingDialog.value = false;
  }
};

const loadNews = async () => {
  if (!business.value?.businessId) return;
  
  newsLoading.value = true;
  
  try {
    const response = await api.get(`/businesses/${business.value.businessId}/news?limit=5`);
    news.value = response.data.data || [];
  } catch (err) {
    console.error('Failed to load news:', err);
    news.value = [];
  } finally {
    newsLoading.value = false;
    applyDefaultTab();
  }
};

const handleAddNews = async () => {
  if (!authStore.isAuthenticated || !isOwner.value) {
    return;
  }

  addingNews.value = true;
  
  try {
    const response = await api.post(`/businesses/${business.value.businessId}/news`, {
      title: newNews.value.title.trim(),
      content: newNews.value.content.trim()
    });
    
    // Добавляем новую новость в начало списка
    news.value.unshift(response.data.data);
    activeTab.value = 'news';

    // Очищаем форму и скрываем её
    newNews.value = { title: '', content: '' };
    showAddNewsForm.value = false;
  } catch (err) {
    alert(err.response?.data?.error || 'Ошибка при добавлении новости');
  } finally {
    addingNews.value = false;
  }
};

const cancelAddNews = () => {
  newNews.value = { title: '', content: '' };
  showAddNewsForm.value = false;
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
  loadBusiness();
});

onUnmounted(() => {
  document.removeEventListener('keydown', onQrModalEscape);
  document.body.style.overflow = '';
});
</script>

<style scoped>
.business-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 2rem 0;
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

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.business-content {
  display: flex;
  flex-direction: column;
  font-size: 0.9375rem;
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.business-content--chat {
  min-height: calc(100vh - 5rem);
}

.business-header-section {
  margin-bottom: 2rem;
}

.header-top-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem 1.25rem;
  margin-bottom: 0.75rem;
}

.header-brand {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  flex: 1 1 14rem;
  min-width: 0;
}

.business-logo {
  flex-shrink: 0;
  width: 88px;
  height: 88px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid #e8e8e8;
  background: #f9f9f9;
}

.header-titles {
  flex: 1 1 10rem;
  min-width: 0;
}

.header-titles h1 {
  margin: 0 0 0.35rem 0;
  color: #333;
  font-size: clamp(1.22rem, 3.65vw, 1.58rem);
  line-height: 1.2;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  flex: 0 1 auto;
}

.slug {
  color: #667eea;
  font-weight: 600;
  font-family: monospace;
  margin: 0;
  font-size: 0.875rem;
}

.description {
  color: #666;
  margin: 1rem 0 0 0;
  line-height: 1.6;
  font-size: 1.035rem;
}

.business-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  /* Не дублируем отступ с .business-header-section: иначе при flex не схлопываются margin’ы — табы «прыгают» на вкладке Чат */
  margin: 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #ddd;
  width: fit-content;
  max-width: 100%;
}

.tab-btn {
  padding: 0.55rem 1.15rem;
  border: none;
  background: #fff;
  cursor: pointer;
  font-size: 0.86rem;
  font-weight: 600;
  color: #555;
  border-right: 1px solid #ddd;
  transition: background 0.15s, color 0.15s;
}

.tab-btn:last-child {
  border-right: none;
}

.tab-btn:hover {
  background: #f3f4fd;
  color: #333;
}

.tab-btn[aria-selected='true'] {
  background: #667eea;
  color: #fff;
}

.tab-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  color: #999;
}

.tab-btn:disabled:hover {
  background: #fff;
  color: #999;
}

.tab-panel {
  margin-top: 1.25rem;
  padding-top: 0.25rem;
}

.tab-panel--chat {
  min-height: 440px;
  display: flex;
  flex-direction: column;
}

.business-content--chat .tab-panel--chat {
  flex: 1;
  min-height: 0;
}

.tab-panel-chat-inner {
  flex: 1;
  min-height: 380px;
  display: flex;
  flex-direction: column;
  border: 1px solid #e2e4ed;
  border-radius: 14px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 4px 24px rgba(15, 23, 42, 0.06);
}

.business-content--chat .tab-panel-chat-inner {
  min-height: 0;
  height: 100%;
}

.tab-chat-owner-hint {
  padding: 1.25rem;
  background: #f8f9fa;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
}

.tab-chat-owner-text {
  margin: 0 0 1rem 0;
  color: #555;
  line-height: 1.5;
}

.tab-chat-error {
  margin-top: 0;
}

.tab-panel-empty {
  margin: 0;
  color: #888;
  font-size: 0.88rem;
}

.card-sections {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 640px) {
  .card-sections {
    grid-template-columns: 1fr 1fr;
  }

  .section-card--wide {
    grid-column: 1 / -1;
  }

  .section-card--half {
    min-width: 0;
  }
}

.section-card {
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  padding: 1rem;
  background: #fafafa;
}

.section-card h3 {
  margin: 0 0 0.75rem 0;
  font-size: 1.05rem;
}

.hours-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.35rem;
}

.messengers-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.5rem;
}

.messengers-list a {
  color: #667eea;
  word-break: break-all;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.5rem;
}

.gallery-grid img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 6px;
}

.btn-icon-header {
  box-sizing: border-box;
  min-width: 2.6rem;
  min-height: 2.6rem;
  width: 2.6rem;
  height: 2.6rem;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  line-height: 0;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.btn-icon-header:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn-icon-header:active:not(:disabled) {
  transform: translateY(0);
}

.action-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.2em;
  height: 1.2em;
  font-size: 1.04rem;
  line-height: 1;
  transform: translateY(-0.5px);
}

.action-icon--subscribed {
  font-size: 0.98rem;
}

.action-icon--svg {
  width: 1.15rem;
  height: 1.15rem;
}

.action-icon--svg svg {
  width: 100%;
  height: 100%;
  display: block;
}

.subscribed-icon-badge {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.6rem;
  min-height: 2.6rem;
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 999px;
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #c8e6c9;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  font-size: 1rem;
  font-weight: 800;
  flex-shrink: 0;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #e0e0e0;
}

.btn-secondary:hover:not(:disabled) {
  background: #e0e0e0;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9375rem;
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

.btn-primary:hover:not(:disabled) {
  background: #5568d3;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.subscribed-badge {
  padding: 0.75rem 1.5rem;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  display: inline-block;
}

@media (max-width: 520px) {
  .header-top-row {
    flex-direction: column;
    align-items: stretch;
  }

  .header-brand {
    flex-wrap: wrap;
  }

  .header-actions {
    justify-content: flex-start;
  }

}

.news-section {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.news-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 0.75rem;
}

.news-heading {
  margin: 0;
  color: #333;
  font-size: 1.35rem;
}

.btn-add-news {
  padding: 0.5rem 1rem;
  font-size: 0.84rem;
}

.add-news-form {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  border: 1px solid #e0e0e0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.form-group label {
  font-weight: 500;
  color: #333;
  font-size: 0.84rem;
}

.form-group input,
.form-group textarea {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-family: inherit;
  transition: border-color 0.2s;
  resize: vertical;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.loading-small {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.no-news {
  text-align: center;
  padding: 2rem;
  color: #999;
  font-style: italic;
}

.news-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.news-item {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  transition: all 0.2s;
}

.news-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.news-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.news-item-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.08rem;
  flex: 1;
}

.news-date {
  color: #666;
  font-size: 0.8rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.news-content {
  color: #555;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
}

.qr-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.45);
}

.qr-modal {
  position: relative;
  max-width: 22rem;
  width: 100%;
  padding: 1.5rem 1.25rem 1.75rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
}

.qr-modal-close {
  position: absolute;
  top: 0.5rem;
  right: 0.6rem;
  width: 2rem;
  height: 2rem;
  border: none;
  background: transparent;
  font-size: 1.35rem;
  line-height: 1;
  color: #666;
  cursor: pointer;
  border-radius: 6px;
}

.qr-modal-close:hover {
  background: #f0f0f0;
  color: #333;
}

.qr-modal-title {
  margin: 0 2rem 0.5rem 0;
  font-size: 1.1rem;
  color: #333;
}

.qr-modal-hint {
  margin: 0 0 0.75rem 0;
  font-size: 0.84rem;
  color: #666;
  line-height: 1.45;
}

.qr-modal-url {
  display: block;
  margin-bottom: 1rem;
  font-size: 0.75rem;
  word-break: break-all;
  color: #667eea;
  text-decoration: none;
}

.qr-modal-url:hover {
  text-decoration: underline;
}

.qr-modal-image-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 220px;
  justify-content: center;
}

.qr-modal-image {
  display: block;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
}

.qr-modal-loading,
.qr-modal-error {
  margin: 0;
  color: #888;
  font-size: 0.88rem;
}

.qr-modal-error {
  color: #c62828;
}
</style>
