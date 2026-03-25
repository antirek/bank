<template>
  <div class="builder-page">
    <div class="container">
      <nav class="builder-breadcrumb" aria-label="Контекст редактирования">
        <router-link to="/my/profile/businesses" class="crumb-link">Мои бизнесы</router-link>
        <span class="crumb-sep" aria-hidden="true">→</span>
        <span class="crumb-current" aria-current="page">{{ businessContextTitle }}</span>
      </nav>
      <div class="header">
        <div class="header-titles">
          <div class="header-title-row">
            <h1>{{ isCreateMode ? 'Новый бизнес' : businessContextTitle }}</h1>
            <button
              type="button"
              class="help-icon-btn"
              :title="builderHelpText"
              :aria-label="builderHelpText"
            >
              <span class="help-icon-q" aria-hidden="true">?</span>
            </button>
          </div>
        </div>
        <div class="header-actions">
          <div v-if="!loading && !error" class="header-save">
            <button type="button" class="btn btn-primary" :disabled="saving" @click="save">
              {{ saving ? 'Сохранение...' : isCreateMode ? 'Создать бизнес' : 'Сохранить' }}
            </button>
            <button
              type="button"
              class="open-public-card-btn"
              :disabled="!cardPublicHref"
              :title="cardPublicHref ? 'Открыть страницу карточки в новой вкладке' : 'Укажите slug в секции «Основное»'"
              :aria-label="
                cardPublicHref
                  ? 'Открыть страницу карточки в новой вкладке'
                  : 'Сначала укажите slug в секции «Основное»'
              "
              @click="openPublicCard"
            >
              <svg
                class="open-public-card-icon"
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </button>
            <span v-if="saveMessage" class="save-message" :class="{ err: saveIsError }">{{ saveMessage }}</span>
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading">Загрузка...</div>
      <div v-else-if="error" class="error-message">{{ error }}</div>
      <div v-else class="builder-layout">
        <div class="sections-panel">
          <div class="panel-title-row">
            <h3>Секции карточки</h3>
            <button
              type="button"
              class="help-icon-btn"
              :title="sectionsHelpText"
              :aria-label="sectionsHelpText"
            >
              <span class="help-icon-q" aria-hidden="true">?</span>
            </button>
          </div>
          <div
            v-for="section in sections"
            :key="section.id"
            class="section-item"
            :class="{ active: selectedSectionId === section.id, disabled: !section.enabled }"
            role="button"
            tabindex="0"
            @click="selectSection(section.id)"
            @keydown.enter.prevent="selectSection(section.id)"
            @keydown.space.prevent="selectSection(section.id)"
          >
            <div class="enabled-toggle">
              <input
                v-model="section.enabled"
                type="checkbox"
                class="section-enabled-cb"
                :aria-label="`Показать на сайте: ${titleByType(section.type)}`"
              />
              <span class="section-title">{{ titleByType(section.type) }}</span>
            </div>
          </div>
        </div>

        <div class="editor-panel">
          <h3>{{ selectedSection ? `Поле: ${titleByType(selectedSection.type)}` : 'Выберите секцию' }}</h3>

          <template v-if="selectedSection?.type === 'hero'">
            <label>Название *</label>
            <input v-model="selectedSection.data.name" type="text" placeholder="Название бизнеса" />
            <label>Slug (URL) *</label>
            <input v-model="selectedSection.data.slug" type="text" placeholder="my-cafe" />
            <p class="hint">Только строчные буквы, цифры и дефисы</p>
            <label>Описание *</label>
            <textarea v-model="selectedSection.data.description" rows="4" placeholder="Кратко о бизнесе" />
            <label>Логотип (URL)</label>
            <input v-model="selectedSection.data.logo" type="url" :placeholder="EXAMPLE_LOGO_URL" />
            <p class="hint">
              Плейсхолдеры картинок:
              <a href="https://loremflickr.com/" target="_blank" rel="noopener noreferrer">loremflickr.com</a>
            </p>
          </template>

          <template v-else-if="selectedSection?.type === 'contacts'">
            <label>Телефоны (по одному в строке)</label>
            <textarea v-model="phonesText" rows="4" placeholder="+7..." @input="syncPhones" />
            <label>Email</label>
            <input v-model="selectedSection.data.email" type="email" />
            <label>Сайт</label>
            <input v-model="selectedSection.data.website" type="url" placeholder="https://..." />
          </template>

          <template v-else-if="selectedSection?.type === 'address'">
            <label>Адрес *</label>
            <textarea v-model="selectedSection.data.address" rows="3" placeholder="Город, улица" />
          </template>

          <template v-else-if="selectedSection?.type === 'gallery'">
            <label>Фото (URL по одному в строке)</label>
            <textarea
              v-model="galleryText"
              rows="6"
              :placeholder="EXAMPLE_GALLERY_TEXT"
              @input="syncGallery"
            />
            <div class="gallery-toolbar">
              <button type="button" class="btn btn-small" @click="insertGalleryExamples">
                Вставить примеры (LoremFlickr)
              </button>
              <a href="https://loremflickr.com/" target="_blank" rel="noopener noreferrer" class="hint-link"
                >loremflickr.com</a
              >
            </div>
          </template>

          <template v-else-if="selectedSection?.type === 'working_hours'">
            <div v-for="day in dayKeys" :key="day" class="day-row">
              <label class="day-label">
                <input v-model="selectedSection.data[day].enabled" type="checkbox" />
                {{ dayNames[day] }}
              </label>
              <input v-model="selectedSection.data[day].from" placeholder="09:00" />
              <input v-model="selectedSection.data[day].to" placeholder="18:00" />
            </div>
          </template>
        </div>

        <div class="preview-panel" role="region" aria-label="Как страница увидят посетители">
          <div class="preview-card">
            <div class="preview-hero">
              <img v-if="previewHero.logo" :src="previewHero.logo" alt="" class="preview-logo" />
              <h2>{{ previewHero.name || 'Название' }}</h2>
              <p class="preview-slug">/b/{{ previewHero.slug || 'slug' }}</p>
              <p v-if="previewHero.description" class="preview-desc">{{ previewHero.description }}</p>
            </div>
            <template v-for="s in previewSections" :key="s.id">
              <section v-if="s.type === 'address' && s.data.address" class="preview-block">
                <h4>Адрес</h4>
                <p>{{ s.data.address }}</p>
              </section>
              <section v-else-if="s.type === 'contacts' && hasContacts(s.data)" class="preview-block">
                <h4>Контакты</h4>
                <p v-if="s.data.email">Email: {{ s.data.email }}</p>
                <p v-if="s.data.website">
                  Сайт:
                  <a :href="s.data.website" target="_blank" rel="noopener noreferrer">{{ s.data.website }}</a>
                </p>
                <ul v-if="s.data.phones?.length">
                  <li v-for="p in s.data.phones" :key="p">{{ p }}</li>
                </ul>
              </section>
              <section v-else-if="s.type === 'working_hours'" class="preview-block">
                <h4>Время работы</h4>
                <ul class="preview-hours">
                  <li v-for="day in dayKeys" :key="day">
                    <strong>{{ dayNames[day] }}:</strong>
                    <span v-if="s.data[day]?.enabled">{{ s.data[day].from }}–{{ s.data[day].to }}</span>
                    <span v-else>выходной</span>
                  </li>
                </ul>
              </section>
              <section v-else-if="s.type === 'gallery' && s.data.images?.length" class="preview-block">
                <h4>Галерея</h4>
                <div class="preview-gallery">
                  <img v-for="img in s.data.images" :key="img" :src="img" alt="" />
                </div>
              </section>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@boqq/api-client';
import {
  EXAMPLE_GALLERY_TEXT,
  EXAMPLE_GALLERY_URLS,
  EXAMPLE_LOGO_URL
} from '../lib/loremFlickr.js';

const builderHelpText =
  'Секции, поля выбранной секции и предпросмотр рядом — изменения видны сразу. Сохранение публикует карточку.';

const sectionsHelpText =
  'Клик по названию или строке — выбрать секцию. Чекбокс — только показ на публичной странице.';

const route = useRoute();
const router = useRouter();

const isCreateMode = computed(() => route.meta.cardBuilderMode === 'create');
const businessId = computed(() => route.params.businessId);

const loading = ref(true);
const saving = ref(false);
const error = ref('');
const saveMessage = ref('');
const saveIsError = ref(false);

const sections = ref([]);
const selectedSectionId = ref('');
const phonesText = ref('');
const galleryText = ref('');

const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const dayNames = { mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Вс' };

function emptyDay() {
  return { enabled: false, from: '', to: '' };
}

function createEmptySections() {
  return [
    { id: 'hero', type: 'hero', enabled: true, order: 0, data: { name: '', slug: '', description: '', logo: '' } },
    {
      id: 'contacts',
      type: 'contacts',
      enabled: true,
      order: 1,
      data: { phones: [], email: '', website: '', messengers: { telegram: '', whatsapp: '' } }
    },
    {
      id: 'working_hours',
      type: 'working_hours',
      enabled: true,
      order: 2,
      data: {
        mon: emptyDay(),
        tue: emptyDay(),
        wed: emptyDay(),
        thu: emptyDay(),
        fri: emptyDay(),
        sat: emptyDay(),
        sun: emptyDay()
      }
    },
    { id: 'address', type: 'address', enabled: true, order: 3, data: { address: '' } },
    { id: 'gallery', type: 'gallery', enabled: true, order: 4, data: { images: [] } }
  ];
}

const selectedSection = computed(() => sections.value.find((s) => s.id === selectedSectionId.value));

const titleByType = (type) =>
  ({
    hero: 'Основное',
    contacts: 'Контакты',
    working_hours: 'Время работы',
    address: 'Адрес',
    gallery: 'Галерея'
  }[type] || type);

const previewHero = computed(() => {
  const hero = sections.value.find((s) => s.type === 'hero');
  return hero?.data || {};
});

const businessContextTitle = computed(() => {
  if (isCreateMode.value) return 'Новый бизнес';
  const name = previewHero.value?.name?.trim();
  if (name) return name;
  if (loading.value) return 'Загрузка…';
  return 'Без названия';
});

const previewSections = computed(() =>
  [...sections.value]
    .filter((s) => s.enabled && s.type !== 'hero')
    .sort((a, b) => a.order - b.order)
);

/** Публичная страница `/b/:slug` — slug как после сохранения (только a-z, 0-9, дефис) */
const cardPublicHref = computed(() => {
  const raw = String(previewHero.value?.slug || '').trim();
  if (!raw) return '';
  const normalized = raw.toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (!normalized) return '';
  return `/b/${encodeURIComponent(normalized)}`;
});

function openPublicCard() {
  const path = cardPublicHref.value;
  if (!path) return;
  const url = router.resolve({ path }).href;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function hasContacts(data) {
  return !!(data?.email || data?.website || (data?.phones && data.phones.length));
}

function selectSection(id) {
  selectedSectionId.value = id;
}

function normalizeOrders() {
  sections.value = sections.value
    .sort((a, b) => a.order - b.order)
    .map((s, idx) => ({ ...s, order: idx }));
  if (!selectedSectionId.value && sections.value.length) {
    selectedSectionId.value = sections.value[0].id;
  }
}

function syncPhones() {
  if (selectedSection.value?.type !== 'contacts') return;
  selectedSection.value.data.phones = phonesText.value.split('\n').map((x) => x.trim()).filter(Boolean);
}

function syncGallery() {
  if (selectedSection.value?.type !== 'gallery') return;
  selectedSection.value.data.images = galleryText.value.split('\n').map((x) => x.trim()).filter(Boolean);
}

function insertGalleryExamples() {
  if (selectedSection.value?.type !== 'gallery') return;
  const lines = EXAMPLE_GALLERY_URLS;
  const current = galleryText.value.trim();
  galleryText.value = current ? `${current}\n${lines.join('\n')}` : lines.join('\n');
  syncGallery();
}

watch(
  selectedSection,
  (val) => {
    if (!val) return;
    if (val.type === 'contacts') {
      phonesText.value = (val.data.phones || []).join('\n');
    } else if (val.type === 'gallery') {
      galleryText.value = (val.data.images || []).join('\n');
    }
  },
  { immediate: true }
);

function normalizeSlugInHero() {
  const hero = sections.value.find((s) => s.type === 'hero');
  if (hero?.data?.slug) {
    hero.data.slug = String(hero.data.slug)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '');
  }
}

async function loadConfig() {
  loading.value = true;
  error.value = '';
  try {
    if (isCreateMode.value) {
      sections.value = createEmptySections();
      normalizeOrders();
      loading.value = false;
      return;
    }
    const res = await api.get(`/businesses/${businessId.value}/card-config`);
    sections.value = res.data.data.sections || [];
    normalizeOrders();
  } catch (e) {
    error.value = e.response?.data?.error || 'Не удалось загрузить данные';
  } finally {
    loading.value = false;
  }
}

async function save() {
  saving.value = true;
  saveMessage.value = '';
  saveIsError.value = false;
  normalizeOrders();
  normalizeSlugInHero();
  try {
    if (isCreateMode.value) {
      const res = await api.post('/businesses', { sections: sections.value });
      const id = res.data.data.businessId;
      saveMessage.value = 'Бизнес создан';
      await router.replace({ path: `/my/profile/businesses/${id}/card-builder` });
      return;
    }
    await api.put(`/businesses/${businessId.value}/card-config`, { sections: sections.value });
    saveMessage.value = 'Сохранено';
  } catch (e) {
    saveIsError.value = true;
    saveMessage.value = e.response?.data?.error || 'Ошибка сохранения';
  } finally {
    saving.value = false;
  }
}

watch(
  () => [route.path, String(route.params.businessId || ''), route.meta.cardBuilderMode],
  () => {
    loadConfig();
  },
  { immediate: true }
);
</script>

<style scoped>
.builder-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 0.4rem 0 1.75rem;
}
.container {
  max-width: 100%;
  margin: 0;
}

.builder-breadcrumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.5rem;
  margin-bottom: 0.55rem;
  padding: 0.4rem 0.85rem;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  width: fit-content;
  max-width: 100%;
  font-size: 0.92rem;
}

.crumb-link {
  color: #667eea;
  font-weight: 600;
  text-decoration: none;
}

.crumb-link:hover {
  text-decoration: underline;
}

.crumb-sep {
  color: #999;
  user-select: none;
}

.crumb-current {
  font-weight: 600;
  color: #333;
  min-width: 0;
  word-break: break-word;
}

.header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}
.header-titles {
  flex: 1;
  min-width: 0;
}
.header-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.header-titles h1 {
  margin: 0;
  word-break: break-word;
}
.help-icon-btn {
  flex-shrink: 0;
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 50%;
  border: 1px solid #c5c5c5;
  background: #fff;
  color: #666;
  cursor: help;
  padding: 0;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.help-icon-btn:hover,
.help-icon-btn:focus-visible {
  outline: none;
  border-color: #667eea;
  color: #667eea;
  background: #f3f4fd;
}
.help-icon-q {
  font-size: 0.82rem;
  font-weight: 700;
  position: relative;
  top: 0.02em;
}
.header-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-shrink: 0;
}
.header-save {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.header-save .save-message {
  margin-left: 0.25rem;
}
.builder-layout {
  display: grid;
  grid-template-columns: minmax(220px, 270px) minmax(0, 1fr) minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}
.sections-panel,
.editor-panel,
.preview-panel {
  background: #fff;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  min-height: 120px;
  max-height: min(72vh, 880px);
  overflow-y: auto;
}
.sections-panel h3,
.editor-panel h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.05rem;
}
.panel-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}
.sections-panel .panel-title-row h3 {
  margin: 0;
}
.open-public-card-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: 1px solid #c5c5c5;
  border-radius: 8px;
  background: #fff;
  color: #555;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.open-public-card-btn:hover:not(:disabled) {
  border-color: #667eea;
  color: #667eea;
  background: #f3f4fd;
}
.open-public-card-btn:focus-visible {
  outline: none;
  border-color: #667eea;
  color: #667eea;
  background: #f3f4fd;
}
.open-public-card-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.open-public-card-icon {
  display: block;
}
.hint {
  font-size: 0.82rem;
  color: #888;
  margin: 0 0 0.75rem 0;
}
.hint a,
.hint-link {
  color: #5c6bc0;
}
.gallery-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.65rem;
  margin-top: 0.35rem;
  font-size: 0.82rem;
}
.hint-link {
  text-decoration: none;
}
.hint-link:hover {
  text-decoration: underline;
}
.section-item {
  border: 2px solid #e6e6e6;
  border-radius: 8px;
  padding: 0.65rem 0.75rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: border-color 0.15s;
}
.section-item:hover {
  border-color: #c5cae9;
}
.section-item.active {
  border-color: #667eea;
}
.section-item.disabled {
  opacity: 0.65;
}
.enabled-toggle {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
}
.section-enabled-cb {
  flex-shrink: 0;
  cursor: pointer;
}
.section-title {
  font-weight: 600;
}
.btn {
  border: 0;
  border-radius: 8px;
  padding: 0.55rem 0.9rem;
  cursor: pointer;
  font-size: 0.9rem;
}
.btn-small {
  padding: 0.3rem 0.5rem;
  background: #ececec;
}
.btn-primary {
  background: #667eea;
  color: #fff;
}
.btn-secondary {
  background: #ececec;
  color: #333;
  text-decoration: none;
  display: inline-block;
}
.save-message {
  color: #2e7d32;
}
.save-message.err {
  color: #c62828;
}
.loading,
.error-message {
  background: #fff;
  padding: 1rem;
  border-radius: 8px;
}
.error-message {
  color: #c62828;
}
.editor-panel label {
  display: block;
  font-weight: 500;
  font-size: 0.88rem;
  margin-top: 0.5rem;
}
.editor-panel input,
.editor-panel textarea {
  width: 100%;
  margin: 0.25rem 0 0.5rem 0;
  padding: 0.55rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-sizing: border-box;
}
.day-row {
  display: grid;
  grid-template-columns: 110px 1fr 1fr;
  gap: 0.45rem;
  align-items: center;
  margin-bottom: 0.35rem;
}
.day-label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
}
.preview-card {
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 1rem;
  background: #fafafa;
}
.preview-hero h2 {
  margin: 0.5rem 0 0.25rem 0;
}
.preview-slug {
  color: #667eea;
  font-family: monospace;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}
.preview-desc {
  color: #555;
  line-height: 1.5;
  margin: 0;
}
.preview-logo {
  max-width: 80px;
  max-height: 80px;
  border-radius: 8px;
  object-fit: cover;
}
.preview-block {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}
.preview-block h4 {
  margin: 0 0 0.5rem 0;
}
.preview-hours {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.95rem;
}
.preview-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.5rem;
}
.preview-gallery img {
  width: 100%;
  height: 90px;
  object-fit: cover;
  border-radius: 6px;
}

@media (max-width: 1024px) {
  .builder-layout {
    grid-template-columns: 1fr;
    max-height: none;
  }
  .sections-panel,
  .editor-panel,
  .preview-panel {
    max-height: none;
  }
}
</style>
