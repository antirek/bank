<template>
  <div class="login-page">
    <div class="login-card">
      <h1>Вход в Boqq</h1>
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
            maxlength="6"
            required
          />
          <p class="hint">В тестовом режиме код: 1234</p>
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
import axios from 'axios';

const authApiUrl = import.meta.env.VITE_AUTH_API_URL || '';

const api = axios.create({
  baseURL: authApiUrl || (import.meta.env.DEV ? '/auth-api' : ''),
  headers: { 'Content-Type': 'application/json' }
});

const phone = ref('');
const code = ref('');
const codeSent = ref(false);
const loading = ref(false);
const error = ref('');

const userUiUrl = (import.meta.env.VITE_USER_UI_URL || (import.meta.env.DEV ? 'http://localhost:5173' : '')).replace(/\/$/, '');

function buildPostLoginUrl(token) {
  const base = userUiUrl || '';
  if (!base) {
    return '';
  }
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const rawReturn = params.get('return');
  if (!rawReturn) {
    return `${base}/#token=${encodeURIComponent(token)}`;
  }
  let decoded;
  try {
    decoded = decodeURIComponent(rawReturn);
  } catch {
    return `${base}/#token=${encodeURIComponent(token)}`;
  }
  try {
    const allowedBase = `${base.replace(/\/$/, '')}/`;
    const u = /^https?:\/\//i.test(decoded)
      ? new URL(decoded)
      : new URL(decoded.replace(/^\//, '/'), allowedBase);
    if (u.origin !== new URL(allowedBase).origin) {
      return `${base}/#token=${encodeURIComponent(token)}`;
    }
    return `${base.replace(/\/$/, '')}${u.pathname}${u.search}#token=${encodeURIComponent(token)}`;
  } catch {
    return `${base}/#token=${encodeURIComponent(token)}`;
  }
}

const handleSubmit = async () => {
  error.value = '';
  loading.value = true;
  try {
    if (!codeSent.value) {
      await api.post('/auth/send-code', { phone: phone.value });
      codeSent.value = true;
    } else {
      const { data } = await api.post('/auth/verify-code', {
        phone: phone.value,
        code: code.value
      });
      const token = data?.data?.token;
      if (!token || !userUiUrl) {
        error.value = 'Не получен токен или не задан VITE_USER_UI_URL';
        return;
      }
      window.location.href = buildPostLoginUrl(token);
      return;
    }
  } catch (err) {
    error.value = err.response?.data?.error || err.message || 'Ошибка. Попробуйте снова.';
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
