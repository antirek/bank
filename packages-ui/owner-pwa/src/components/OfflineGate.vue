<template>
  <Teleport to="body">
    <div v-if="showBlocking" class="offline-gate" role="alertdialog" aria-live="polite">
      <div class="offline-gate__card">
        <p class="offline-gate__title">Нет подключения</p>
        <p class="offline-gate__text">Проверьте сеть и попробуйте снова.</p>
        <button type="button" class="offline-gate__btn" @click="retry">Повторить</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const online = ref(
  typeof navigator !== 'undefined' ? navigator.onLine : true
);

const showBlocking = computed(() => !online.value);

function setFromNavigator() {
  online.value = navigator.onLine;
}

function retry() {
  if (navigator.onLine) {
    online.value = true;
    window.location.reload();
    return;
  }
  online.value = navigator.onLine;
}

onMounted(() => {
  window.addEventListener('online', setFromNavigator);
  window.addEventListener('offline', setFromNavigator);
});

onUnmounted(() => {
  window.removeEventListener('online', setFromNavigator);
  window.removeEventListener('offline', setFromNavigator);
});
</script>

<style scoped>
.offline-gate {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  padding-top: calc(1.5rem + env(safe-area-inset-top, 0px));
  padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));
  background: rgba(30, 30, 40, 0.72);
  backdrop-filter: blur(6px);
}

.offline-gate__card {
  max-width: 320px;
  width: 100%;
  padding: 1.5rem;
  border-radius: 14px;
  background: #fff;
  text-align: center;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
}

.offline-gate__title {
  margin: 0 0 0.5rem;
  font-size: 1.15rem;
  font-weight: 700;
  color: #333;
}

.offline-gate__text {
  margin: 0 0 1.25rem;
  font-size: 0.92rem;
  color: #666;
  line-height: 1.45;
}

.offline-gate__btn {
  width: 100%;
  padding: 0.65rem 1rem;
  border: none;
  border-radius: 10px;
  background: #5c6bc0;
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.offline-gate__btn:hover {
  background: #3f51b5;
}
</style>
