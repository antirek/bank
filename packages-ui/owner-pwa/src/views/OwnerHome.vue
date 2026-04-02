<template>
  <div class="owner-shell">
    <header class="owner-header">
      <span class="owner-title">{{ appTitle }}</span>
      <button type="button" class="owner-logout" @click="onLogout">Выйти</button>
    </header>
    <main class="owner-main">
      <MyBusinessChats
        chats-base-path="/"
        dialog-back-path="/"
        layout-top-reserve="52px"
        :pwa-safe-area="true"
      />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { ownerAppConfig } from '@/config.js';
import { useAuthStore } from '@/stores/auth';
import MyBusinessChats from '../../../user-ui/src/views/MyBusinessChats.vue';

const authStore = useAuthStore();

const appTitle = computed(() => ownerAppConfig.appTitle);

function onLogout() {
  authStore.logout();
  const base = ownerAppConfig.ownerPublicOrigin.replace(/\/$/, '');
  const ret = encodeURIComponent(`${base}/`);
  window.location.href = `${ownerAppConfig.authUiUrl}?return=${ret}`;
}
</script>

<style scoped>
.owner-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f0f2f8;
}

.owner-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(0.65rem + env(safe-area-inset-top, 0px)) 1rem 0.65rem;
  padding-left: calc(1rem + env(safe-area-inset-left, 0px));
  padding-right: calc(1rem + env(safe-area-inset-right, 0px));
  background: #fff;
  border-bottom: 1px solid #e2e4ea;
  box-sizing: border-box;
}

.owner-title {
  font-weight: 700;
  font-size: 1rem;
  color: #333;
}

.owner-logout {
  padding: 0.4rem 0.85rem;
  font-size: 0.88rem;
  border: 1px solid #cfd4dc;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  color: #444;
}

.owner-logout:hover {
  background: #f5f5f5;
}

.owner-main {
  flex: 1;
  min-height: 0;
  padding: 0.5rem 0.75rem calc(0.75rem + env(safe-area-inset-bottom, 0px));
  padding-left: calc(0.75rem + env(safe-area-inset-left, 0px));
  padding-right: calc(0.75rem + env(safe-area-inset-right, 0px));
  box-sizing: border-box;
}
</style>
