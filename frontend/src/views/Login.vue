<template>
  <div class="login-page">
    <div class="login-card">
      <h1>Вход в Bank</h1>
      <p class="subtitle">Система общения бизнеса и клиентов</p>

      <form @submit.prevent="handleSubmit" class="login-form">
        <div class="form-group">
          <label for="phone">Номер телефона</label>
          <input
            id="phone"
            v-model="phone"
            type="tel"
            placeholder="+79001234567"
            required
            :disabled="codeSent"
          />
        </div>

        <div v-if="!codeSent" class="form-group">
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Отправка...' : 'Получить код' }}
          </button>
        </div>

        <div v-if="codeSent" class="form-group">
          <label for="code">SMS код</label>
          <input
            id="code"
            v-model="code"
            type="text"
            placeholder="1234"
            maxlength="4"
            required
          />
          <p class="hint">Тестовый код: 1234</p>
        </div>

        <div v-if="codeSent" class="form-group">
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Вход...' : 'Войти' }}
          </button>
          <button
            type="button"
            class="btn btn-secondary"
            @click="resetForm"
            :disabled="loading"
          >
            Изменить номер
          </button>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const phone = ref('');
const code = ref('');
const codeSent = ref(false);
const loading = ref(false);
const error = ref('');

const handleSubmit = async () => {
  error.value = '';
  loading.value = true;

  try {
    if (!codeSent.value) {
      // Отправка кода
      const result = await authStore.sendCode(phone.value);
      if (result.success) {
        codeSent.value = true;
      } else {
        error.value = result.error;
      }
    } else {
      // Верификация кода и вход
      const result = await authStore.login(phone.value, code.value);
      if (result.success) {
        router.push('/');
      } else {
        error.value = result.error;
      }
    }
  } catch (err) {
    error.value = 'Произошла ошибка. Попробуйте еще раз.';
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  codeSent.value = false;
  code.value = '';
  error.value = '';
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.login-card {
  background: white;
  border-radius: 12px;
  padding: 2.5rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

h1 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 2rem;
}

.subtitle {
  color: #666;
  margin-bottom: 2rem;
  font-size: 0.9rem;
}

.login-form {
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

input {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

input:focus {
  outline: none;
  border-color: #667eea;
}

input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.hint {
  font-size: 0.85rem;
  color: #999;
  margin: 0;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
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
  margin-top: 0.5rem;
}

.btn-secondary:hover:not(:disabled) {
  background: #e0e0e0;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
}
</style>
