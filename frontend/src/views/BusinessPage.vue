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
          <p class="slug">/{{ business.slug }}</p>
          <p v-if="business.description" class="description">
            {{ business.description }}
          </p>
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
            <router-link
              v-if="!authStore.isAuthenticated"
              to="/login"
              class="btn btn-primary"
            >
              Войти
            </router-link>
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
import api from '../api';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const business = ref(null);
const loading = ref(true);
const error = ref('');
const subscribing = ref(false);
const isSubscribed = ref(false);
const startingDialog = ref(false);

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
    
    // Проверяем подписку, если пользователь авторизован
    if (authStore.isAuthenticated) {
      await checkSubscription();
    }
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
    alert(err.response?.data?.error || 'Ошибка при создании диалога');
  } finally {
    startingDialog.value = false;
  }
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
</style>
