import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import Home from '../views/Home.vue';

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
  // Старые URL → /my/...
  { path: '/profile', redirect: '/my/profile' },
  { path: '/profile/edit', redirect: '/my/profile/edit' },
  { path: '/feed', redirect: '/my/feed' },
  { path: '/my-dialogs', redirect: '/my/dialogs' },
  { path: '/my-subscriptions', redirect: '/my/profile/subscriptions' },
  { path: '/my/subscriptions', redirect: '/my/profile/subscriptions' },
  { path: '/my/businesses', redirect: '/my/profile/businesses' },
  { path: '/my/business-chats', redirect: '/my/profile/business-chats' },
  { path: '/create-business', redirect: '/my/create-business' },
  {
    path: '/dialogs/:dialogId',
    redirect: (to) => ({ path: `/my/dialogs/${to.params.dialogId}`, replace: true })
  },
  {
    path: '/businesses/:id/edit',
    redirect: (to) => ({ path: `/my/profile/businesses/${to.params.id}/card-builder`, replace: true })
  },
  {
    path: '/my-businesses/:businessId/dialogs',
    redirect: (to) => ({ path: `/my/businesses/${to.params.businessId}/dialogs`, replace: true })
  },
  {
    path: '/my-businesses/:businessId/card-builder',
    redirect: (to) => ({
      path: `/my/profile/businesses/${to.params.businessId}/card-builder`,
      replace: true
    })
  },
  {
    path: '/my/businesses/:businessId/card-builder',
    redirect: (to) => ({
      path: `/my/profile/businesses/${to.params.businessId}/card-builder`,
      replace: true
    })
  },
  {
    path: '/my-businesses/:businessId/dialogs/:dialogId',
    redirect: (to) => ({
      path: `/my/businesses/${to.params.businessId}/dialogs/${to.params.dialogId}`,
      replace: true
    })
  },
  {
    path: '/my/create-business',
    name: 'CreateBusiness',
    component: () => import('../views/BusinessCardBuilder.vue'),
    meta: { requiresAuth: true, cardBuilderMode: 'create' }
  },
  {
    path: '/my/feed',
    name: 'NewsFeed',
    component: () => import('../views/NewsFeed.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/catalog',
    name: 'Catalog',
    component: () => import('../views/Catalog.vue')
  },
  {
    path: '/b/:slug',
    name: 'BusinessPage',
    component: () => import('../views/BusinessPage.vue')
  },
  {
    path: '/business/:slug',
    redirect: (to) => ({ path: `/b/${to.params.slug}`, replace: true })
  },
  {
    path: '/my/profile/edit',
    name: 'ProfileEdit',
    component: () => import('../views/ProfileEdit.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/my/profile',
    component: () => import('../views/ProfileLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'ProfileHome',
        component: () => import('../views/Profile.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'subscriptions',
        name: 'ProfileSubscriptions',
        component: () => import('../views/MySubscriptions.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'businesses',
        name: 'ProfileBusinesses',
        component: () => import('../views/MyBusinesses.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'businesses/:businessId/card-builder',
        name: 'BusinessCardBuilder',
        component: () => import('../views/BusinessCardBuilder.vue'),
        meta: { requiresAuth: true, cardBuilderMode: 'edit' }
      },
      {
        path: 'business-chats',
        name: 'ProfileBusinessChats',
        component: () => import('../views/MyBusinessChats.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },
  {
    path: '/my/dialogs',
    name: 'MyDialogs',
    component: () => import('../views/MyDialogs.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/my/dialogs/:dialogId',
    name: 'DialogView',
    component: () => import('../views/MyDialogs.vue'),
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: '/my/businesses/:businessId/dialogs',
    name: 'BusinessDialogs',
    component: () => import('../views/BusinessDialogs.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/my/businesses/:businessId/dialogs/:dialogId',
    name: 'BusinessDialogView',
    component: () => import('../views/DialogView.vue'),
    meta: { requiresAuth: true },
    props: (route) => ({
      dialogId: route.params.dialogId,
      backUrl: `/my/businesses/${route.params.businessId}/dialogs`
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

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

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
