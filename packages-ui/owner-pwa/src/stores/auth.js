import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@boqq/api-client';

function parseJwtPayload(tokenStr) {
  if (!tokenStr || typeof tokenStr !== 'string') return null;
  const parts = tokenStr.split('.');
  if (parts.length < 2) return null;
  const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4;
  const padded = pad ? b64 + '='.repeat(4 - pad) : b64;
  try {
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function userFromPayload(payload) {
  if (!payload?.userId) return null;
  return {
    userId: payload.userId,
    phone: payload.phone,
    name: payload.name || ''
  };
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
  const user = ref(null);
  const isRestoring = ref(false);
  let restoreInFlight = null;

  const isAuthenticated = computed(() => !!token.value && !!user.value);

  const setToken = (newToken) => {
    token.value = newToken;
    if (typeof localStorage === 'undefined') return;
    if (newToken) {
      localStorage.setItem('token', newToken);
    } else {
      localStorage.removeItem('token');
    }
  };

  const setUser = (userData) => {
    user.value = userData;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const restoreUser = async () => {
    if (!token.value) {
      return;
    }
    if (user.value) {
      return;
    }
    if (restoreInFlight) {
      return restoreInFlight;
    }

    restoreInFlight = (async () => {
      isRestoring.value = true;
      try {
        const payload = parseJwtPayload(token.value);
        if (!payload?.userId) {
          console.error('No userId in token');
          logout();
          return;
        }

        const response = await api.get(`/users/${payload.userId}`);
        const userData = response.data?.data;
        if (userData) {
          setUser(userData);
        } else {
          setUser(userFromPayload(payload));
        }
      } catch (error) {
        console.error('Failed to restore user from token:', error);
        const status = error.response?.status;
        const payload = parseJwtPayload(token.value);
        if (!payload) {
          logout();
          return;
        }
        if (status === 401) {
          logout();
          return;
        }
        const minimal = userFromPayload(payload);
        if (minimal) {
          setUser(minimal);
        } else {
          setUser(null);
        }
      } finally {
        isRestoring.value = false;
        restoreInFlight = null;
      }
    })();

    return restoreInFlight;
  };

  return {
    token,
    user,
    isAuthenticated,
    isRestoring,
    logout,
    setToken,
    setUser,
    restoreUser
  };
});
