<template>
  <div class="redirect-page">
    <template v-if="misconfig">
      <p class="redirect-page__title">Неверная настройка входа</p>
      <p class="redirect-page__hint">
        URL входа указывает на этот же сайт. На user-api задайте
        <strong>PUBLIC_AUTH_UI_URL</strong> на отдельный поддомен auth или
        <strong>VITE_AUTH_UI_URL</strong> при сборке.
      </p>
      <p class="redirect-page__code">Сейчас: {{ authUiUrl || '(пусто)' }}</p>
    </template>
    <p v-else-if="!started">Перенаправление на страницу входа…</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getAuthUiBase, isAuthUiSameAppRoot } from '../utils/authEntry';

const route = useRoute();
const misconfig = ref(false);
const started = ref(false);
const authUiUrl = getAuthUiBase();

onMounted(() => {
  if (isAuthUiSameAppRoot()) {
    misconfig.value = true;
    return;
  }

  started.value = true;

  const rawQ = route.query.return;
  const returnForAuth =
    typeof rawQ === 'string' && rawQ.length > 0
      ? rawQ
      : `${window.location.origin}/`;

  let auth;
  try {
    auth = new URL(authUiUrl.includes('://') ? authUiUrl : `https://${authUiUrl}`);
  } catch {
    misconfig.value = true;
    return;
  }

  auth.searchParams.set('return', returnForAuth);
  window.location.href = auth.href;
});
</script>

<style scoped>
.redirect-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 1.5rem;
  font-size: 1.05rem;
  color: #444;
  text-align: center;
  max-width: 36rem;
  margin: 0 auto;
}

.redirect-page__title {
  font-weight: 700;
  color: #c62828;
  margin: 0 0 0.75rem 0;
}

.redirect-page__hint {
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.redirect-page__code {
  margin: 0;
  font-size: 0.85rem;
  word-break: break-all;
  color: #666;
  font-family: ui-monospace, monospace;
}
</style>
