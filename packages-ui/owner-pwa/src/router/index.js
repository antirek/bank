import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { ownerAppConfig } from '@/config.js';

const routes = [
  {
    path: '/',
    name: 'OwnerChats',
    component: () => import('@/views/OwnerHome.vue'),
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

function redirectToOwnerLogin(to) {
  const base = ownerAppConfig.ownerPublicOrigin.replace(/\/$/, '');
  const returnUrl = new URL(to.fullPath, `${base}/`).href;
  const ret = encodeURIComponent(returnUrl);
  window.location.href = `${ownerAppConfig.authUiUrl}?return=${ret}`;
}

router.beforeEach(async (to, _from, next) => {
  if (!to.meta.requiresAuth) {
    next();
    return;
  }

  const authStore = useAuthStore();

  if (!authStore.token) {
    redirectToOwnerLogin(to);
    return;
  }

  if (!authStore.user) {
    await authStore.restoreUser();
  }

  if (!authStore.token || !authStore.user) {
    redirectToOwnerLogin(to);
    return;
  }

  next();
});

export default router;
