import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import Home from '../views/Home.vue';
import CreateBusiness from '../views/CreateBusiness.vue';

const authUiUrl = import.meta.env.VITE_AUTH_UI_URL || 'http://localhost:5174';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginRedirect.vue')
  },
  {
    path: '/create-business',
    name: 'CreateBusiness',
    component: CreateBusiness,
    meta: { requiresAuth: true }
  },
  {
    path: '/my-businesses',
    name: 'MyBusinesses',
    component: () => import('../views/MyBusinesses.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/businesses/:id/edit',
    name: 'EditBusiness',
    component: () => import('../views/EditBusiness.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/my-subscriptions',
    name: 'MySubscriptions',
    component: () => import('../views/MySubscriptions.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/catalog',
    name: 'Catalog',
    component: () => import('../views/Catalog.vue')
  },
  {
    path: '/business/:slug',
    name: 'BusinessPage',
    component: () => import('../views/BusinessPage.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/my-dialogs',
    name: 'MyDialogs',
    component: () => import('../views/MyDialogs.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dialogs/:dialogId',
    name: 'DialogView',
    component: () => import('../views/DialogView.vue'),
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: '/my-businesses/:businessId/dialogs',
    name: 'BusinessDialogs',
    component: () => import('../views/BusinessDialogs.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/my-businesses/:businessId/dialogs/:dialogId',
    name: 'BusinessDialogView',
    component: () => import('../views/DialogView.vue'),
    meta: { requiresAuth: true },
    props: (route) => ({
      dialogId: route.params.dialogId,
      backUrl: `/my-businesses/${route.params.businessId}/dialogs`
    })
  },
  {
    path: '/users/:userId',
    name: 'UserCard',
    component: () => import('../views/UserCard.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation guard для проверки авторизации
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  
  // Если есть токен, но нет пользователя, пытаемся восстановить
  if (authStore.token && !authStore.user) {
    await authStore.restoreUser();
  }
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    window.location.href = authUiUrl;
    return;
  }
  next();
});

export default router;
