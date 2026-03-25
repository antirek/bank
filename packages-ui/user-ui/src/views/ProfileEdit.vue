<template>
  <div class="profile-edit-page">
    <div class="container">
      <div class="page-head">
        <router-link to="/my/profile" class="back-link">← Назад к профилю</router-link>
        <h1>Редактирование профиля</h1>
      </div>

      <div v-if="loading" class="loading">
        Загрузка...
      </div>

      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-else class="edit-card">
        <div class="profile-header">
          <div class="avatar-section">
            <div class="avatar-preview-wrap">
              <img v-if="avatarPreview" :src="avatarPreview" alt="" class="avatar-preview" />
              <div v-else class="avatar-placeholder">
                {{ userInitials }}
              </div>
            </div>
            <input
              ref="avatarInput"
              type="file"
              accept="image/*"
              style="display: none"
              @change="handleAvatarChange"
            />
            <button type="button" class="btn-change-avatar" @click="$refs.avatarInput.click()">
              Выбрать фото
            </button>
            <button
              v-if="avatarPreview"
              type="button"
              class="btn-remove-avatar"
              @click="clearAvatar"
            >
              Убрать фото
            </button>
          </div>

          <div class="profile-info">
            <p class="phone">{{ user?.phone }}</p>
            <p class="user-id">ID: {{ user?.userId }}</p>
          </div>
        </div>

        <form class="profile-form" @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="edit-name">Имя</label>
            <input
              id="edit-name"
              v-model="form.name"
              type="text"
              placeholder="Введите ваше имя"
              autocomplete="name"
            />
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Сохранение...' : 'Сохранить' }}
            </button>
            <router-link to="/my/profile" class="btn btn-secondary">Отмена</router-link>
          </div>

          <div v-if="saveError" class="error-banner">
            {{ saveError }}
          </div>

          <div v-if="saveSuccess" class="success-banner">
            Профиль сохранён
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import api from '@boqq/api-client';

const router = useRouter();
const authStore = useAuthStore();
const user = ref(null);
const loading = ref(true);
const error = ref('');
const saving = ref(false);
const saveError = ref('');
const saveSuccess = ref(false);
const avatarInput = ref(null);

const form = ref({
  name: ''
});

const avatarPreview = ref('');

/** null — не меняли аватар; иначе строка для API (data URL или ''). */
const avatarPayload = ref(null);

const userInitials = computed(() => {
  if (user.value?.name?.trim()) {
    return user.value.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
  const phone = user.value?.phone || '';
  return phone.length >= 2 ? phone.slice(-2).toUpperCase() : '??';
});

const syncFromUser = (u) => {
  user.value = u;
  form.value.name = u?.name || '';
  avatarPreview.value = u?.avatar?.trim() ? u.avatar : '';
  avatarPayload.value = null;
};

const loadUser = async () => {
  loading.value = true;
  error.value = '';
  try {
    if (authStore.user?.userId) {
      const response = await api.get(`/users/${authStore.user.userId}`);
      syncFromUser(response.data.data);
      authStore.setUser(response.data.data);
    } else {
      error.value = 'Не удалось определить пользователя';
    }
  } catch (err) {
    error.value = err.response?.data?.error || 'Ошибка при загрузке';
  } finally {
    loading.value = false;
  }
};

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const handleAvatarChange = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (file.size > MAX_AVATAR_BYTES) {
    saveError.value = 'Файл слишком большой (до 2 МБ)';
    event.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result;
    if (typeof dataUrl === 'string') {
      avatarPreview.value = dataUrl;
      avatarPayload.value = dataUrl;
      saveError.value = '';
    }
  };
  reader.readAsDataURL(file);
  event.target.value = '';
};

const clearAvatar = () => {
  avatarPreview.value = '';
  avatarPayload.value = '';
};

const handleSubmit = async () => {
  if (!authStore.user?.userId) return;
  saveError.value = '';
  saveSuccess.value = false;
  saving.value = true;
  try {
    let avatarToSend;
    if (avatarPayload.value !== null) {
      avatarToSend = avatarPayload.value;
    } else {
      avatarToSend = user.value?.avatar || '';
    }

    const response = await api.put(`/users/${authStore.user.userId}`, {
      name: form.value.name.trim(),
      avatar: avatarToSend
    });
    syncFromUser(response.data.data);
    authStore.setUser(response.data.data);
    saveSuccess.value = true;
    setTimeout(() => {
      router.push('/my/profile');
    }, 600);
  } catch (err) {
    saveError.value = err.response?.data?.error || 'Ошибка при сохранении';
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  loadUser();
});
</script>

<style scoped>
.profile-edit-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 2rem 0;
}

.container {
  max-width: 640px;
  margin: 0 auto;
}

.page-head {
  margin-bottom: 1.5rem;
}

.back-link {
  display: inline-block;
  margin-bottom: 0.75rem;
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
}

.back-link:hover {
  text-decoration: underline;
}

h1 {
  margin: 0;
  color: #333;
  font-size: 1.65rem;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 1rem;
  border-radius: 8px;
}

.edit-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.profile-header {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e8e8e8;
  flex-wrap: wrap;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.avatar-preview-wrap {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  background: #eee;
}

.avatar-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-preview-wrap .avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2.5rem;
  font-weight: 600;
}

.btn-change-avatar {
  padding: 0.5rem 1rem;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-change-avatar:hover {
  background: #e8e8e8;
}

.btn-remove-avatar {
  padding: 0.35rem 0.75rem;
  background: transparent;
  border: none;
  color: #888;
  font-size: 0.85rem;
  cursor: pointer;
  text-decoration: underline;
}

.profile-info {
  flex: 1;
  min-width: 180px;
}

.phone {
  color: #666;
  margin: 0 0 0.5rem 0;
  font-size: 1.05rem;
}

.user-id {
  color: #999;
  margin: 0;
  font-size: 0.85rem;
  font-family: monospace;
}

.profile-form {
  padding-top: 0.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
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

.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.btn {
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5568d3;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background: #e5e5e5;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-banner {
  margin-top: 1rem;
  background: #ffebee;
  color: #c62828;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
}

.success-banner {
  margin-top: 1rem;
  background: #e8f5e9;
  color: #2e7d32;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
}
</style>
