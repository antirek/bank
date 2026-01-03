<template>
  <div v-if="authStore.isAuthenticated && !authStore.isRestoring" class="user-header">
    <div class="user-header-content">
      <router-link to="/profile" class="user-info-link">
        <div class="avatar-mini">
          {{ userInitials }}
        </div>
        <div class="user-details">
          <span class="user-name">{{ authStore.user?.name || authStore.user?.phone || 'Пользователь' }}</span>
          <span class="user-phone">{{ authStore.user?.phone }}</span>
        </div>
      </router-link>
      <button @click="handleLogout" class="btn-logout-mini" title="Выйти">
        Выйти
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const userInitials = computed(() => {
  if (!authStore.user) return '??';
  const name = authStore.user.name;
  if (!name || name.trim() === '') {
    // Если имени нет, используем первые две цифры телефона
    const phone = authStore.user.phone || '';
    return phone.slice(-2).toUpperCase();
  }
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
});

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.user-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.user-info-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: inherit;
  transition: opacity 0.2s;
  flex: 1;
}

.user-info-link:hover {
  opacity: 0.8;
}

.avatar-mini {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.user-name {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.user-phone {
  font-size: 0.85rem;
  color: #666;
}

.btn-logout-mini {
  padding: 0.5rem 1rem;
  background: #f5f5f5;
  color: #333;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-logout-mini:hover {
  background: #eeeeee;
  border-color: #d0d0d0;
}

@media (max-width: 768px) {
  .user-header-content {
    padding: 0.75rem 1rem;
  }

  .user-phone {
    display: none;
  }

  .user-name {
    font-size: 0.9rem;
  }

  .btn-logout-mini {
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
  }
}
</style>
