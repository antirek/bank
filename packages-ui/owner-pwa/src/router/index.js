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
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();

  if (authStore.token && !authStore.user) {
    await authStore.restoreUser();
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    const base = ownerAppConfig.ownerPublicOrigin.replace(/\/$/, '');
    const returnUrl = new URL(to.fullPath, `${base}/`).href;
    const ret = encodeURIComponent(returnUrl);
    window.location.href = `${ownerAppConfig.authUiUrl}?return=${ret}`;
    return;
  }

  next();
});

export default router;
