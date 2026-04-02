<template>
  <div id="app">
    <UserHeader v-if="!hideChrome" />
    <main class="app-main" :class="{ 'app-main--embed': hideChrome }">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { provide, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from './stores/auth';
import { useChatRealtimeStore } from './stores/chatRealtime';
import { UserHeader } from '@boqq/ui';
import { ensureAudioUnlocked } from './utils/incomingMessageSound.js';

const authStore = useAuthStore();
const chatRealtime = useChatRealtimeStore();
const route = useRoute();
const hideChrome = computed(() => Boolean(route.meta.hideChrome));
provide('authStore', authStore);

watch(
  () => authStore.token,
  (token) => {
    if (token) {
      chatRealtime.connect(token);
    } else {
      chatRealtime.disconnect();
    }
  },
  { immediate: true }
);

const unlockNotificationAudio = () => {
  ensureAudioUnlocked();
};

onMounted(() => {
  window.addEventListener('pointerdown', unlockNotificationAudio, { passive: true });
  window.addEventListener('keydown', unlockNotificationAudio, { passive: true });
});

onUnmounted(() => {
  chatRealtime.disconnect();
  window.removeEventListener('pointerdown', unlockNotificationAudio);
  window.removeEventListener('keydown', unlockNotificationAudio);
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #f5f5f5;
}

#app {
  min-height: 100vh;
  background: #f5f5f5;
  --app-content-max-width: 1200px;
  --app-content-padding-x: 1.5rem;
}

.app-main {
  max-width: var(--app-content-max-width);
  margin: 0 auto;
  padding-left: var(--app-content-padding-x);
  padding-right: var(--app-content-padding-x);
  width: 100%;
  box-sizing: border-box;
}

@media (max-width: 768px) {
  #app {
    --app-content-padding-x: 1rem;
  }
}

.app-main--embed {
  max-width: none;
  margin: 0;
  padding: 0;
  width: 100%;
}
</style>
