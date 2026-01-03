import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../api';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null);
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));

  const isAuthenticated = computed(() => !!token.value);

  const setToken = (newToken) => {
    token.value = newToken;
    if (newToken) {
      localStorage.setItem('token', newToken);
    } else {
      localStorage.removeItem('token');
    }
  };

  const setUser = (userData) => {
    user.value = userData;
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('user');
    }
  };

  const login = async (phone, code) => {
    try {
      const response = await api.post('/auth/verify-code', { phone, code });
      setToken(response.data.data.token);
      setUser(response.data.data.user);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const sendCode = async (phone) => {
    try {
      await api.post('/auth/send-code', { phone });
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to send code' 
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('user');
  };

  // Восстановление пользователя из токена при загрузке
  const restoreUser = async () => {
    if (token.value && !user.value) {
      try {
        // Декодируем токен для получения userId
        const payload = JSON.parse(atob(token.value.split('.')[1]));
        // Можно сделать запрос к API для получения полной информации о пользователе
        // Пока просто используем данные из токена
        if (payload.userId) {
          setUser({
            userId: payload.userId,
            phone: payload.phone
          });
        }
      } catch (error) {
        console.error('Failed to restore user from token:', error);
      }
    }
  };

  // Вызываем при инициализации
  if (token.value && !user.value) {
    restoreUser();
  }

  return {
    token,
    user,
    isAuthenticated,
    login,
    sendCode,
    logout,
    setToken,
    setUser,
    restoreUser
  };
});
