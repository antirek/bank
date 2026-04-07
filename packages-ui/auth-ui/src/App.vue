<template>
  <div class="login-page">
    <div v-if="configLoading" class="login-card login-card--loading">Загрузка…</div>
    <div v-else class="login-card">
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
import { ref, onMounted } from 'vue';
import axios from 'axios';

// До fetch /public-config.json: dev — прокси /auth-api; prod — '' (тот же origin).
// После ответа бэкенда: apiBaseUrl из JSON перезаписывает axios.defaults.baseURL.
const api = axios.create({
  baseURL: import.meta.env.DEV
    ? (import.meta.env.VITE_AUTH_API_URL?.trim() || '/auth-api')
    : '',
  headers: { 'Content-Type': 'application/json' }
});

const phone = ref('');
const code = ref('');
const codeSent = ref(false);
const loading = ref(false);
const error = ref('');
const configLoading = ref(true);

const userUiUrl = ref(
  (import.meta.env.VITE_USER_UI_URL || (import.meta.env.DEV ? 'http://localhost:5173' : '')).replace(
    /\/$/,
    ''
  )
);
const ownerAppPublicUrl = ref(
  (import.meta.env.VITE_OWNER_APP_PUBLIC_URL || '').replace(/\/$/, '')
);

async function loadPublicConfig() {
  try {
    const res = await fetch('/public-config.json', { cache: 'no-store' });
    if (!res.ok) return;
    const j = await res.json();
    if (j.apiBaseUrl != null && String(j.apiBaseUrl).trim() !== '') {
      api.defaults.baseURL = String(j.apiBaseUrl).replace(/\/$/, '');
    }
    if (j.userUiUrl && String(j.userUiUrl).trim()) {
      userUiUrl.value = String(j.userUiUrl).replace(/\/$/, '');
    }
    if (j.ownerAppPublicUrl && String(j.ownerAppPublicUrl).trim()) {
      ownerAppPublicUrl.value = String(j.ownerAppPublicUrl).replace(/\/$/, '');
    }
  } catch {
    /* остаются VITE_* и дефолтный baseURL */
  } finally {
    configLoading.value = false;
  }
}

onMounted(() => {
  loadPublicConfig();
});

function originOfAppBase(base) {
  if (!base) return '';
  try {
    return new URL(base.startsWith('http') ? base : `https://${base}`).origin;
  } catch {
    return '';
  }
}

function buildPostLoginUrl(token) {
  const uu = userUiUrl.value;
  const ou = ownerAppPublicUrl.value;
  const userOrigin = originOfAppBase(uu);
  const ownerOrigin = originOfAppBase(ou);
  const defaultBase = uu || ou || '';
  if (!defaultBase) {
    return '';
  }
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const rawReturn = params.get('return');
  if (!rawReturn) {
    return `${defaultBase}/#token=${encodeURIComponent(token)}`;
  }
  let decoded;
  try {
    decoded = decodeURIComponent(rawReturn);
  } catch {
    return `${defaultBase}/#token=${encodeURIComponent(token)}`;
  }
  try {
    const u = /^https?:\/\//i.test(decoded)
      ? new URL(decoded)
      : new URL(decoded.replace(/^\//, '/'), `${uu || ou}/`);
    const allowed =
      (userOrigin && u.origin === userOrigin) || (ownerOrigin && u.origin === ownerOrigin);
    if (!allowed) {
      return `${defaultBase}/#token=${encodeURIComponent(token)}`;
    }
    const targetBase = ownerOrigin && u.origin === ownerOrigin ? ou : uu;
    const base = (targetBase || defaultBase).replace(/\/$/, '');
    return `${base}${u.pathname}${u.search}#token=${encodeURIComponent(token)}`;
  } catch {
    return `${defaultBase}/#token=${encodeURIComponent(token)}`;
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
      if (!token || (!userUiUrl.value && !ownerAppPublicUrl.value)) {
        error.value =
          'Не получен токен или не заданы URL приложений (PUBLIC_USER_UI_URL / PUBLIC_OWNER_APP_URL на auth-api или VITE_* при сборке)';
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
.login-card--loading {
  text-align: center;
  color: #666;
}

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
