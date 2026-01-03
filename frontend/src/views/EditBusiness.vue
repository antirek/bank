<template>
  <div class="edit-business-page">
    <div class="container">
      <h1>Редактировать бизнес</h1>

      <div v-if="loading" class="loading">
        Загрузка...
      </div>

      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>

      <form v-else @submit.prevent="handleSubmit" class="business-form">
        <div class="form-group">
          <label for="name">Название бизнеса *</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            placeholder="Например: Кофейня 'Уютная'"
            required
          />
        </div>

        <div class="form-group">
          <label for="slug">Slug (URL) *</label>
          <input
            id="slug"
            v-model="form.slug"
            type="text"
            placeholder="coffee-cozy"
            required
          />
          <p class="hint">Только строчные буквы, цифры и дефисы</p>
          <p v-if="slugChanged" class="warning">
            ⚠️ Изменение slug может повлиять на публичную ссылку на ваш бизнес
          </p>
        </div>

        <div class="form-group">
          <label for="description">Описание</label>
          <textarea
            id="description"
            v-model="form.description"
            rows="4"
            placeholder="Расскажите о вашем бизнесе..."
          ></textarea>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Сохранение...' : 'Сохранить изменения' }}
          </button>
          <router-link to="/my-businesses" class="btn btn-secondary">
            Отмена
          </router-link>
        </div>

        <div v-if="saveError" class="error-message">
          {{ saveError }}
        </div>

        <div v-if="saveSuccess" class="success-message">
          Изменения успешно сохранены!
        </div>
      </form>
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

const businessId = route.params.id;
const originalSlug = ref('');
const form = ref({
  name: '',
  slug: '',
  description: ''
});

const loading = ref(true);
const saving = ref(false);
const error = ref('');
const saveError = ref('');
const saveSuccess = ref(false);

const slugChanged = computed(() => {
  return form.value.slug !== originalSlug.value;
});

const loadBusiness = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const response = await api.get(`/businesses/${businessId}`);
    const business = response.data.data;
    
    // Проверяем, что пользователь - владелец
    const currentUserId = authStore.user?.userId;
    if (!currentUserId || business.ownerId !== currentUserId) {
      error.value = 'У вас нет прав для редактирования этого бизнеса';
      console.error('Owner mismatch:', { businessOwnerId: business.ownerId, currentUserId });
      return;
    }
    
    form.value = {
      name: business.name,
      slug: business.slug,
      description: business.description || ''
    };
    originalSlug.value = business.slug;
  } catch (err) {
    error.value = err.response?.data?.error || 'Ошибка при загрузке бизнеса';
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  saveError.value = '';
  saveSuccess.value = false;
  saving.value = true;

  try {
    // Преобразуем slug в нижний регистр
    form.value.slug = form.value.slug.toLowerCase().replace(/[^a-z0-9-]/g, '');

    await api.put(`/businesses/${businessId}`, {
      name: form.value.name,
      slug: form.value.slug,
      description: form.value.description
    });
    
    saveSuccess.value = true;
    originalSlug.value = form.value.slug;
    
    setTimeout(() => {
      router.push('/my-businesses');
    }, 1500);
  } catch (err) {
    saveError.value = err.response?.data?.error || 'Ошибка при сохранении изменений';
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  loadBusiness();
});
</script>

<style scoped>
.edit-business-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 2rem;
}

.container {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h1 {
  margin: 0 0 2rem 0;
  color: #333;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.business-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
}

input,
textarea {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.2s;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: #667eea;
}

.hint {
  font-size: 0.85rem;
  color: #999;
  margin: 0;
}

.warning {
  font-size: 0.85rem;
  color: #f57c00;
  margin: 0.25rem 0 0 0;
  padding: 0.5rem;
  background: #fff3e0;
  border-radius: 6px;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
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

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5568d3;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
}

.success-message {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
}
</style>
