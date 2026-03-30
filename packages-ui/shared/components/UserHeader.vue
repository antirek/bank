<template>
  <div v-if="authStore?.isAuthenticated && !authStore?.isRestoring" class="user-header">
    <div class="user-header-content">
      <div class="user-header-left">
        <router-link to="/my/profile" class="user-info-link">
          <div class="avatar-mini">
            {{ userInitials }}
          </div>
          <div class="user-details">
            <span class="user-name">{{ authStore.user?.name || authStore.user?.phone || 'Пользователь' }}</span>
            <span class="user-phone">{{ authStore.user?.phone }}</span>
          </div>
        </router-link>
        <nav class="user-nav user-nav--near-user" aria-label="Лента и чаты">
        <router-link to="/my/feed" class="nav-link">Лента</router-link>
        <router-link to="/my/dialogs" class="nav-link">Чаты</router-link>
        </nav>
      </div>
      <div class="user-header-right">
        <router-link to="/my/profile/businesses" class="nav-link">Мои бизнесы</router-link>
        <router-link to="/catalog" class="nav-link">Каталог</router-link>
        <button @click="handleLogout" class="btn-logout-mini" title="Выйти">
          Выйти
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, inject } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const authStore = inject('authStore');

const userInitials = computed(() => {
  if (!authStore?.user) return '??';
  const name = authStore.user.name;
  if (!name || name.trim() === '') {
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
  authStore?.logout();
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
  max-width: var(--app-content-max-width, 1200px);
  margin: 0 auto;
  padding: 0.75rem var(--app-content-padding-x, 1.5rem);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-header-left {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
  flex: 1;
}

.user-header-right {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
  margin-left: auto;
}

.user-info-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: inherit;
  transition: opacity 0.2s;
  min-width: 0;
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

.user-nav {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  flex-shrink: 0;
}

.user-nav--near-user {
  padding-left: 0.15rem;
}

.nav-link {
  padding: 0.5rem 0.85rem;
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  border-radius: 6px;
  transition: all 0.2s;
  white-space: nowrap;
}

.nav-link:hover {
  background: #f0f0f0;
  color: #5568d3;
}

.nav-link.router-link-active {
  background: #eef0fb;
  color: #4c63d2;
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
    padding: 0.75rem var(--app-content-padding-x, 1rem);
    flex-wrap: wrap;
    row-gap: 0.5rem;
  }

  .user-header-left {
    flex: 1 1 auto;
    min-width: 0;
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

  .nav-link {
    padding: 0.45rem 0.65rem;
    font-size: 0.85rem;
  }
}
</style>
