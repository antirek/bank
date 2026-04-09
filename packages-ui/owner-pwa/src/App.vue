<template>
  <OfflineGate />
  <PwaUpdateBar />
  <PwaInstallInvite />
  <router-view />
</template>

<script setup>
import { watch, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useChatRealtimeStore } from '@/stores/chatRealtime';
import { usePushNotificationsStore } from '@/stores/pushNotifications';
import { ensureAudioUnlocked } from '@/utils/incomingMessageSound.js';
import OfflineGate from '@/components/OfflineGate.vue';
import PwaUpdateBar from '@/components/PwaUpdateBar.vue';
import PwaInstallInvite from '@/components/PwaInstallInvite.vue';

const authStore = useAuthStore();
const chatRealtime = useChatRealtimeStore();
const pushNotifications = usePushNotificationsStore();

watch(
  () => authStore.token,
  (token) => {
    if (token) {
      chatRealtime.connect(token);
      pushNotifications.syncIfSubscribed();
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
    sans-serif;
  -webkit-font-smoothing: antialiased;
  background: #f0f2f8;
}
</style>
