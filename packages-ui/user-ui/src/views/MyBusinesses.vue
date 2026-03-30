<template>
  <div class="my-businesses-page">
    <div class="container">
      <div class="header">
        <h1>Мои бизнесы</h1>
        <router-link to="/my/create-business" class="btn btn-primary">
          + Создать бизнес
        </router-link>
      </div>

      <div v-if="loading" class="loading">
        Загрузка...
      </div>

      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-else-if="businesses.length === 0" class="empty-state">
        <p>У вас пока нет бизнесов</p>
        <router-link to="/my/create-business" class="btn btn-primary">
          Создать первый бизнес
        </router-link>
      </div>

      <div v-else class="businesses-grid">
        <div
          v-for="business in businesses"
          :key="business.businessId"
          class="business-card"
        >
          <div class="business-header">
            <h3>{{ business.name }}</h3>
            <div class="business-actions">
              <router-link
                :to="{ path: '/my/profile/business-chats', query: { business: business.businessId } }"
                class="btn-icon dialogs-link"
                title="Диалоги"
              >
                💬
                <span v-if="business.unreadDialogsCount > 0" class="unread-badge-small">
                  {{ business.unreadDialogsCount }}
                </span>
              </router-link>
              <router-link
                :to="`/my/profile/businesses/${business.businessId}/card-builder`"
                class="btn-icon"
                title="Карточка бизнеса"
              >
                ✏️
              </router-link>
              <a
                v-if="business.slug"
                :href="`/b/${business.slug}`"
                class="btn-icon btn-icon-svg"
                target="_blank"
                rel="noopener noreferrer"
                title="Публичная карточка (новая вкладка)"
                aria-label="Открыть публичную карточку в новой вкладке"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
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
              </a>
            </div>
          </div>
          
          <div class="business-info">
            <p class="slug">/b/{{ business.slug }}</p>
            <p v-if="business.description" class="description">
              {{ business.description }}
            </p>
            <p v-else class="description empty">Нет описания</p>
          </div>

          <div class="business-footer">
            <span class="status" :class="{ active: business.isActive }">
              {{ business.isActive ? 'Активен' : 'Неактивен' }}
            </span>
            <span class="public-status">
              {{ business.isPublic ? 'Публичный' : 'Приватный' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import api from '@boqq/api-client';

const authStore = useAuthStore();
const businesses = ref([]);
const loading = ref(true);
const error = ref('');

const loadBusinesses = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const response = await api.get('/businesses', {
      params: {
        ownerId: authStore.user?.userId
      }
    });
    businesses.value = response.data.data || [];
    
    // Загружаем количество непрочитанных диалогов для каждого бизнеса
    await Promise.all(
      businesses.value.map(async (business) => {
        try {
          const dialogsResponse = await api.get(`/businesses/${business.businessId}/dialogs`);
          const dialogs = dialogsResponse.data.data || [];
          business.unreadDialogsCount = dialogs.reduce((sum, d) => sum + (d.unreadCount || 0), 0);
        } catch (err) {
          business.unreadDialogsCount = 0;
        }
      })
    );
  } catch (err) {
    error.value = err.response?.data?.error || 'Ошибка при загрузке бизнесов';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadBusinesses();
});
</script>

<style scoped>
.my-businesses-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 0.35rem 0 1.75rem;
}

.container {
  max-width: 100%;
  margin: 0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.header h1 {
  margin: 0;
  color: #333;
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

.btn-primary:hover {
  background: #5568d3;
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
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
}

.businesses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.business-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.business-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.business-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.business-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.25rem;
  flex: 1;
}

.business-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.dialogs-link {
  position: relative;
}

.unread-badge-small {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #f44336;
  color: white;
  border-radius: 10px;
  padding: 0.15rem 0.4rem;
  font-size: 0.7rem;
  font-weight: 600;
  min-width: 18px;
  text-align: center;
  line-height: 1.2;
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 1.75rem;
  height: 1.75rem;
  padding: 0;
  background: #f5f5f5;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
  font-size: 1rem;
  line-height: 1;
  transition: background 0.2s;
}

.btn-icon svg {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  display: block;
}

.btn-icon:hover {
  background: #e0e0e0;
}

.btn-icon-svg {
  color: #555;
}

.business-info {
  margin-bottom: 1rem;
}

.slug {
  color: #667eea;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  font-family: monospace;
}

.description {
  color: #666;
  margin: 0.5rem 0 0 0;
  line-height: 1.5;
}

.description.empty {
  color: #999;
  font-style: italic;
}

.business-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
  font-size: 0.9rem;
}

.status {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  background: #f5f5f5;
  color: #666;
}

.status.active {
  background: #e8f5e9;
  color: #2e7d32;
}

.public-status {
  color: #999;
}
</style>
