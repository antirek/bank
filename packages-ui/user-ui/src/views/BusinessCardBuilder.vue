<template>
  <div class="builder-page">
    <div class="container">
      <div class="header">
        <div class="header-titles">
          <h1>{{ isCreateMode ? 'Новый бизнес' : 'Карточка бизнеса' }}</h1>
          <p class="subtitle">
            Заполните секции слева — так же увидят карточку посетители. Сохранение сразу публикует изменения.
          </p>
        </div>
        <div class="header-actions">
          <div class="mode-toggle" role="group" aria-label="Режим">
            <button
              type="button"
              class="mode-btn"
              :class="{ active: uiMode === 'edit' }"
              @click="uiMode = 'edit'"
            >
              Редактирование
            </button>
            <button
              type="button"
              class="mode-btn"
              :class="{ active: uiMode === 'preview' }"
              @click="uiMode = 'preview'"
            >
              Предпросмотр
            </button>
          </div>
          <router-link to="/my-businesses" class="btn btn-secondary">К моим бизнесам</router-link>
        </div>
      </div>

      <div v-if="loading" class="loading">Загрузка...</div>
      <div v-else-if="error" class="error-message">{{ error }}</div>
      <div v-else class="builder-layout">
        <div class="sections-panel">
          <h3>Секции карточки</h3>
          <p class="hint">Клик по блоку — выбрать для редактирования. Галочка — показать на публичной странице.</p>
          <div
            v-for="(section, idx) in sections"
            :key="section.id"
            class="section-item"
            :class="{ active: selectedSectionId === section.id, disabled: !section.enabled }"
            role="button"
            tabindex="0"
            @click="selectSection(section.id)"
            @keydown.enter.prevent="selectSection(section.id)"
            @keydown.space.prevent="selectSection(section.id)"
          >
            <div class="section-row">
              <label class="enabled-toggle" @click.stop>
                <input v-model="section.enabled" type="checkbox" />
                <span class="section-title">{{ titleByType(section.type) }}</span>
              </label>
              <div class="row-actions" @click.stop>
                <button type="button" class="btn btn-small" :disabled="idx === 0" @click="moveUp(idx)">↑</button>
                <button type="button" class="btn btn-small" :disabled="idx === sections.length - 1" @click="moveDown(idx)">↓</button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="uiMode === 'edit'" class="editor-panel">
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

        <div v-else class="preview-panel">
          <h3>Как увидят гости</h3>
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

      <div v-if="!loading && !error" class="footer-actions">
        <button type="button" class="btn btn-primary" :disabled="saving" @click="save">
          {{ saving ? 'Сохранение...' : isCreateMode ? 'Создать бизнес' : 'Сохранить' }}
        </button>
        <span v-if="saveMessage" class="save-message" :class="{ err: saveIsError }">{{ saveMessage }}</span>
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

const route = useRoute();
const router = useRouter();

const isCreateMode = computed(() => route.meta.cardBuilderMode === 'create');
const businessId = computed(() => route.params.businessId);

const loading = ref(true);
const saving = ref(false);
const error = ref('');
const saveMessage = ref('');
const saveIsError = ref(false);
const uiMode = ref('edit');

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

const previewSections = computed(() =>
  [...sections.value]
    .filter((s) => s.enabled && s.type !== 'hero')
    .sort((a, b) => a.order - b.order)
);

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

function moveUp(idx) {
  const next = [...sections.value];
  [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
  sections.value = next;
  normalizeOrders();
}

function moveDown(idx) {
  const next = [...sections.value];
  [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
  sections.value = next;
  normalizeOrders();
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
      await router.replace({ path: `/my-businesses/${id}/card-builder` });
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
  padding: 2rem;
}
.container {
  max-width: 1100px;
  margin: 0 auto;
}
.header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.25rem;
}
.header-titles h1 {
  margin: 0 0 0.35rem 0;
}
.subtitle {
  margin: 0;
  color: #666;
  font-size: 0.95rem;
  max-width: 36rem;
}
.header-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}
.mode-toggle {
  display: flex;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #ddd;
}
.mode-btn {
  padding: 0.45rem 0.85rem;
  border: none;
  background: #fff;
  cursor: pointer;
  font-size: 0.9rem;
}
.mode-btn.active {
  background: #667eea;
  color: #fff;
}
.builder-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
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
.section-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}
.enabled-toggle {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  cursor: pointer;
}
.section-title {
  font-weight: 600;
}
.row-actions {
  display: flex;
  gap: 0.25rem;
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
.footer-actions {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
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
</style>
