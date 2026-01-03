import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import Home from '../views/Home.vue';
import Login from '../views/Login.vue';
import CreateBusiness from '../views/CreateBusiness.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
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
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation guard для проверки авторизации
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else {
    next();
  }
});

export default router;
