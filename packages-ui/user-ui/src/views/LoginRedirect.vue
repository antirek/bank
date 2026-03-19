<template>
  <div class="redirect-page">
    <p>Перенаправление на страницу входа…</p>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';

const authUiUrl = import.meta.env.VITE_AUTH_UI_URL || 'http://localhost:5174';

onMounted(() => {
  window.location.href = authUiUrl;
});
</script>

<style scoped>
.redirect-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  font-size: 1.1rem;
  color: #666;
}
</style>
