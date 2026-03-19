import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@boqq/api-client';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
  const user = ref(null);
  const isRestoring = ref(false);

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
    if (!token.value || isRestoring.value) {
      return;
    }

    isRestoring.value = true;

    try {
      // Декодируем токен для получения userId
      const payload = JSON.parse(atob(token.value.split('.')[1]));
      
      if (!payload.userId) {
        console.error('No userId in token');
        logout();
        return;
      }

      // Всегда загружаем полные данные пользователя из API
      const response = await api.get(`/users/${payload.userId}`);
      const userData = response.data.data;
      setUser(userData);
    } catch (error) {
      console.error('Failed to restore user from token:', error);
      // 401/404: не очищаем токен здесь — оставим в localStorage; при следующем запросе перехватчик сделает logout и редирект
      if (error.response?.status === 401 || error.response?.status === 404) {
        setUser(null);
      } else {
        // Сеть и т.п.: подставляем минимальные данные из токена
        try {
          const payload = JSON.parse(atob(token.value.split('.')[1]));
          setUser({
            userId: payload.userId,
            phone: payload.phone
          });
        } catch (e) {
          setUser(null);
        }
      }
    } finally {
      isRestoring.value = false;
    }
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
