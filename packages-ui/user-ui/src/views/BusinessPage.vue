<template>
  <div class="business-page">
    <div class="container">
      <div v-if="loading" class="loading">
        Загрузка...
      </div>

      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-else-if="business" class="business-content">
        <div class="business-header-section">
          <h1>{{ business.name }}</h1>
          <p class="slug">/b/{{ business.slug }}</p>
          <p v-if="business.description" class="description">
            {{ business.description }}
          </p>
          <!-- Уголок с профилем владельца -->
          <div v-if="owner" class="owner-section">
            <OwnerCard
              :owner-id="owner.userId"
              :owner-name="owner.name"
              :owner-phone="owner.phone"
            />
          </div>
        </div>

        <div v-if="renderedSections.length" class="card-sections">
          <section v-for="section in renderedSections" :key="section.id" class="section-card">
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

        <div class="business-actions">
          <div class="actions-row">
            <!-- Если пользователь - владелец бизнеса, показываем кнопку "Обращения" -->
            <router-link
              v-if="authStore.isAuthenticated && isOwner"
              :to="`/my-businesses/${business.businessId}/dialogs`"
              class="btn btn-primary"
            >
              📨 Обращения
            </router-link>
            <!-- Если пользователь - не владелец, показываем кнопку "Начать диалог" -->
            <button
              v-else-if="authStore.isAuthenticated && !isOwner"
              @click="handleStartDialog"
              class="btn btn-primary"
              :disabled="startingDialog"
            >
              {{ startingDialog ? 'Открытие...' : '💬 Начать диалог' }}
            </button>
            <!-- Кнопка подписки только для не-владельцев -->
            <button
              v-if="authStore.isAuthenticated && !isOwner && !isSubscribed"
              @click="handleSubscribe"
              class="btn btn-secondary"
              :disabled="subscribing"
            >
              {{ subscribing ? 'Подписка...' : '+ Подписаться' }}
            </button>
            <span v-else-if="authStore.isAuthenticated && !isOwner && isSubscribed" class="subscribed-badge">
              ✓ Вы подписаны
            </span>
            <!-- Для неавторизованных пользователей -->
            <a
              v-if="!authStore.isAuthenticated"
              :href="authUiUrl"
              class="btn btn-primary"
            >
              Войти
            </a>
          </div>
        </div>

        <!-- Блок новостей -->
        <div class="news-section">
          <div class="news-header">
            <h2>Новости</h2>
            <button
              v-if="authStore.isAuthenticated && isOwner"
              @click="showAddNewsForm = !showAddNewsForm"
              class="btn btn-primary btn-add-news"
            >
              {{ showAddNewsForm ? 'Отмена' : '+ Добавить новость' }}
            </button>
          </div>

          <!-- Форма добавления новости (только для владельца) -->
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
                <button type="button" @click="cancelAddNews" class="btn btn-secondary">
                  Отмена
                </button>
              </div>
            </form>
          </div>

          <!-- Список новостей -->
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
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import api from '@boqq/api-client';
import { OwnerCard } from '@boqq/ui';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const authUiUrl = import.meta.env.VITE_AUTH_UI_URL || 'http://localhost:5174';
const business = ref(null);
const owner = ref(null);
const news = ref([]);
const loading = ref(true);
const error = ref('');
const subscribing = ref(false);
const isSubscribed = ref(false);
const startingDialog = ref(false);
const newsLoading = ref(false);
const showAddNewsForm = ref(false);
const addingNews = ref(false);
const newNews = ref({
  title: '',
  content: ''
});
const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const dayNames = { mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Вс' };

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
  return [
    { id: 'address', type: 'address', enabled: !!business.value.address, order: 0, data: { address: business.value.address || business.value.location?.address || '' } },
    { id: 'contacts', type: 'contacts', enabled: true, order: 1, data: business.value.contacts || { phones: [], email: '', website: '' } },
    { id: 'working_hours', type: 'working_hours', enabled: true, order: 2, data: business.value.workingHours || {} },
    { id: 'gallery', type: 'gallery', enabled: Array.isArray(business.value.gallery) && business.value.gallery.length > 0, order: 3, data: { images: business.value.gallery || [] } }
  ];
});

const renderedSections = computed(() => {
  const sections = business.value?.card?.sections?.length ? business.value.card.sections : fallbackSections.value;
  return sections.filter((s) => s.enabled).sort((a, b) => a.order - b.order);
});

const sectionTitle = (type) => ({
  address: 'Адрес',
  contacts: 'Контакты',
  working_hours: 'Время работы',
  gallery: 'Галерея',
  hero: 'Основное'
}[type] || type);

const galleryImages = (section) => section.data?.images || [];

const loadBusiness = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const response = await api.get(`/businesses/slug/${route.params.slug}`);
    business.value = response.data.data;
    
    // Отладочная информация
    console.log('Business loaded:', {
      businessId: business.value?.businessId,
      ownerId: business.value?.ownerId,
      currentUserId: authStore.user?.userId,
      isOwner: business.value?.ownerId === authStore.user?.userId
    });
    
    // Загружаем информацию о владельце
    if (business.value?.ownerId) {
      await loadOwner();
    }
    
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

const loadOwner = async () => {
  try {
    const response = await api.get(`/users/${business.value.ownerId}`);
    owner.value = response.data.data;
  } catch (err) {
    console.error('Failed to load owner:', err);
    // Если не удалось загрузить владельца, создаем минимальную информацию
    owner.value = {
      userId: business.value.ownerId,
      name: '',
      phone: ''
    };
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
  
  try {
    const response = await api.post(`/businesses/${business.value.businessId}/dialogs/start`);
    const dialogId = response.data.data.dialogId;
    // Переходим на страницу диалога
    router.push(`/dialogs/${dialogId}`);
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
</script>

<style scoped>
.business-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 2rem;
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
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.business-header-section {
  margin-bottom: 2rem;
}

h1 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.slug {
  color: #667eea;
  font-weight: 600;
  font-family: monospace;
  margin: 0.5rem 0;
}

.description {
  color: #666;
  margin: 1rem 0 0 0;
  line-height: 1.6;
  font-size: 1.1rem;
}

.owner-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.card-sections {
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.section-card {
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  padding: 1rem;
  background: #fafafa;
}

.section-card h3 {
  margin: 0 0 0.75rem 0;
}

.hours-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.35rem;
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

.business-actions {
  padding-top: 2rem;
  border-top: 1px solid #e0e0e0;
}

.actions-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
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
  font-size: 1rem;
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
  font-size: 1rem;
  font-weight: 600;
  display: inline-block;
}

.news-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e0e0e0;
}

.news-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.news-header h2 {
  margin: 0;
  color: #333;
  font-size: 1.5rem;
}

.btn-add-news {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
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
  font-size: 0.9rem;
}

.form-group input,
.form-group textarea {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
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
  font-size: 1.2rem;
  flex: 1;
}

.news-date {
  color: #666;
  font-size: 0.85rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.news-content {
  color: #555;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
}
</style>
