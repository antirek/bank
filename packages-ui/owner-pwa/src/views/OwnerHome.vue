<template>
  <div class="owner-shell">
    <header class="owner-header">
      <span class="owner-title">{{ appTitle }}</span>
      <div class="owner-header-actions">
        <div v-if="push.supported && push.vapidReady" class="owner-push">
          <button
            type="button"
            class="owner-push-btn"
            :disabled="push.busy"
            @click="onPushClick"
          >
            {{ pushButtonLabel }}
          </button>
          <span v-if="push.lastError" class="owner-push-err" :title="push.lastError">!</span>
        </div>
        <button type="button" class="owner-logout" @click="onLogout">Выйти</button>
      </div>
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
import { computed, onMounted } from 'vue';
import { ownerAppConfig } from '@/config.js';
import { useAuthStore } from '@/stores/auth';
import { usePushNotificationsStore } from '@/stores/pushNotifications';
import MyBusinessChats from '../../../user-ui/src/views/MyBusinessChats.vue';

const authStore = useAuthStore();
const push = usePushNotificationsStore();

const appTitle = computed(() => ownerAppConfig.appTitle);

const pushButtonLabel = computed(() => {
  if (push.busy) return '…';
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    return 'Push: вкл.';
  }
  return 'Включить push';
});

function onPushClick() {
  push.enable();
}

async function onLogout() {
  await push.revoke();
  authStore.logout();
  const base = ownerAppConfig.ownerPublicOrigin.replace(/\/$/, '');
  const ret = encodeURIComponent(`${base}/`);
  window.location.href = `${ownerAppConfig.authUiUrl}?return=${ret}`;
}

onMounted(() => {
  push.syncIfSubscribed();
});
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

.owner-header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.owner-push {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.owner-push-btn {
  padding: 0.35rem 0.65rem;
  font-size: 0.8rem;
  border: 1px solid #c5cad4;
  border-radius: 8px;
  background: #f7f8fb;
  cursor: pointer;
  color: #444;
  white-space: nowrap;
}

.owner-push-btn:hover:not(:disabled) {
  background: #eef0f5;
}

.owner-push-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.owner-push-err {
  color: #c62828;
  font-weight: 800;
  font-size: 0.85rem;
  cursor: help;
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
