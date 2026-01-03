<template>
  <div class="create-business-page">
    <div class="container">
      <h1>Создать бизнес</h1>

      <form @submit.prevent="handleSubmit" class="business-form">
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
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Создание...' : 'Создать бизнес' }}
          </button>
          <router-link to="/" class="btn btn-secondary">Отмена</router-link>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div v-if="success" class="success-message">
          Бизнес успешно создан!
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api';

const router = useRouter();

const form = ref({
  name: '',
  slug: '',
  description: ''
});

const loading = ref(false);
const error = ref('');
const success = ref(false);

const handleSubmit = async () => {
  error.value = '';
  success.value = false;
  loading.value = true;

  try {
    // Преобразуем slug в нижний регистр
    form.value.slug = form.value.slug.toLowerCase().replace(/[^a-z0-9-]/g, '');

    const response = await api.post('/businesses', form.value);
    
    success.value = true;
    
    setTimeout(() => {
      router.push('/');
    }, 1500);
  } catch (err) {
    error.value = err.response?.data?.error || 'Ошибка при создании бизнеса';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.create-business-page {
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
