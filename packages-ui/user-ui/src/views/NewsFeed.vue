<template>
  <div class="news-feed-page">
    <div class="container">
      <div class="header">
        <h1>{{ globalFeed ? 'Новости' : 'Лента' }}</h1>
        <p class="subtitle">
          {{
            globalFeed
              ? 'Последние новости всех бизнесов'
              : 'Новости бизнесов, на которые вы подписаны'
          }}
        </p>
      </div>

      <div v-if="loading" class="loading">
        Загрузка...
      </div>

      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-else-if="items.length === 0" class="empty-state">
        <p v-if="globalFeed">Пока нет опубликованных новостей.</p>
        <p v-else>Пока здесь пусто — подпишитесь на бизнесы, чтобы видеть их новости в этой ленте.</p>
        <router-link to="/catalog" class="btn btn-primary">
          Каталог бизнесов
        </router-link>
        <router-link v-if="!globalFeed" to="/my/profile/subscriptions" class="btn btn-secondary">
          Мои подписки
        </router-link>
      </div>

      <div v-else class="feed-list">
        <article
          v-for="item in items"
          :key="item.newsId"
          class="feed-card"
        >
          <div class="feed-meta">
            <router-link
              v-if="item.business?.slug"
              :to="`/b/${item.business.slug}`"
              class="business-link"
            >
              {{ item.business.name || 'Бизнес' }}
            </router-link>
            <span v-else class="business-link muted">Бизнес удалён</span>
            <time :datetime="item.createdAt" class="feed-time">{{ formatDate(item.createdAt) }}</time>
          </div>
          <h2 class="feed-title">{{ item.title }}</h2>
          <p class="feed-content">{{ item.content }}</p>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useAuthStore } from '../stores/auth';
import api from '@boqq/api-client';

const props = defineProps({
  globalFeed: { type: Boolean, default: false }
});

const authStore = useAuthStore();
const items = ref([]);
const loading = ref(true);
const error = ref('');

function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function loadFeed() {
  loading.value = true;
  error.value = '';
  try {
    if (props.globalFeed) {
      const res = await api.get('/news/feed', { params: { limit: 30 } });
      items.value = Array.isArray(res.data?.data) ? res.data.data : [];
      return;
    }
    const userId = authStore.user?.userId;
    if (!userId) {
      error.value = 'Не удалось определить пользователя';
      return;
    }
    const res = await api.get(`/users/${userId}/news-feed`);
    items.value = Array.isArray(res.data?.data) ? res.data.data : [];
  } catch (err) {
    error.value = err.response?.data?.error || 'Ошибка при загрузке ленты';
  } finally {
    loading.value = false;
  }
}

// Один и тот же компонент на `/` и `/my/feed` — экземпляр переиспользуется, onMounted не вызывается снова.
watch(
  () => props.globalFeed,
  () => {
    loadFeed();
  },
  { immediate: true }
);
</script>

<style scoped>
.news-feed-page {
  min-height: 60vh;
  padding: 1.5rem 0 3rem;
}

.container {
  max-width: 720px;
  margin: 0 auto;
  padding: 0;
}

.header {
  margin-bottom: 1.75rem;
}

.header h1 {
  margin: 0 0 0.35rem;
  font-size: 1.65rem;
  color: #222;
}

.subtitle {
  margin: 0;
  color: #666;
  font-size: 0.95rem;
}

.loading,
.error-message {
  padding: 2rem 0;
  text-align: center;
  color: #555;
}

.error-message {
  color: #c62828;
}

.empty-state {
  text-align: center;
  padding: 2.5rem 1rem;
  background: #fafafa;
  border-radius: 12px;
  border: 1px solid #eee;
}

.empty-state p {
  margin: 0 0 1.25rem;
  color: #555;
  line-height: 1.5;
}

.empty-state .btn {
  display: inline-block;
  margin: 0 0.35rem 0.5rem;
  padding: 0.65rem 1.1rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
}

.btn-primary {
  background: #667eea;
  color: #fff;
}

.btn-primary:hover {
  background: #5568d3;
  color: #fff;
}

.btn-secondary {
  background: #fff;
  color: #667eea;
  border: 1px solid #667eea;
}

.btn-secondary:hover {
  background: #f5f6ff;
}

.feed-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.feed-card {
  padding: 1.25rem 1.35rem;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.feed-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.65rem;
}

.business-link {
  font-weight: 600;
  color: #667eea;
  text-decoration: none;
}

.business-link:hover {
  text-decoration: underline;
}

.business-link.muted {
  color: #999;
  pointer-events: none;
}

.feed-time {
  font-size: 0.8rem;
  color: #888;
}

.feed-title {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
  color: #222;
  line-height: 1.35;
}

.feed-content {
  margin: 0;
  white-space: pre-wrap;
  color: #444;
  font-size: 0.95rem;
  line-height: 1.55;
}
</style>
