import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@boqq/api-client';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
  const user = ref(null);
  const isRestoring = ref(false);
  /** Один общий промис, чтобы router и main не «пропускали» второй вызов restoreUser пока идёт первый */
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
    // Пользователя не храним в sessionStorage - загружаем из API при восстановлении
  };

  const login = async () => { /* не используется: вход через auth-ui */ };
  const sendCode = async () => { /* не используется: вход через auth-ui */ };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  // Восстановление пользователя из токена при загрузке
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
        const payload = JSON.parse(atob(token.value.split('.')[1]));

        if (!payload.userId) {
          console.error('No userId in token');
          logout();
          return;
        }

        const response = await api.get(`/users/${payload.userId}`);
        const userData = response.data.data;
        setUser(userData);
      } catch (error) {
        console.error('Failed to restore user from token:', error);
        const status = error.response?.status;
        try {
          const payload = JSON.parse(atob(token.value.split('.')[1]));
          if (status === 401) {
            // Токен недействителен — выходим из сессии
            logout();
            return;
          }
          if (status === 404) {
            // Пользователя нет в БД user-api, но JWT валиден — не рвём сессию (иначе guard шлёт на auth-ui)
            setUser({
              userId: payload.userId,
              phone: payload.phone,
              name: payload.name || ''
            });
            return;
          }
          setUser({
            userId: payload.userId,
            phone: payload.phone,
            name: payload.name || ''
          });
        } catch (e) {
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
    login,
    sendCode,
    logout,
    setToken,
    setUser,
    restoreUser
  };
});
