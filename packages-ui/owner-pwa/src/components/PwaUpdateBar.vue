<template>
  <div v-if="needRefresh" class="pwa-update-bar" role="status">
    <span>Доступна новая версия приложения</span>
    <button type="button" class="pwa-update-bar__btn" @click="updateServiceWorker()">
      Обновить
    </button>
  </div>
</template>

<script setup>
import { useRegisterSW } from 'virtual:pwa-register/vue';

const { needRefresh, updateServiceWorker } = useRegisterSW({ immediate: true });
</script>

<style scoped>
.pwa-update-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 99998;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: calc(0.65rem + env(safe-area-inset-bottom, 0px)) 1rem 0.65rem;
  background: #3949ab;
  color: #fff;
  font-size: 0.9rem;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.12);
}

.pwa-update-bar__btn {
  padding: 0.35rem 0.9rem;
  border: none;
  border-radius: 8px;
  background: #fff;
  color: #3949ab;
  font-weight: 600;
  cursor: pointer;
}

.pwa-update-bar__btn:hover {
  background: #e8eaf6;
}
</style>
