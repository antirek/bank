import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../api';

export const useAuthStore = defineStore('auth', () => {
  // Используем sessionStorage для изоляции сессий между вкладками
  const token = ref(sessionStorage.getItem('token') || null);
  // Не загружаем пользователя из sessionStorage - загрузим из API при восстановлении
  const user = ref(null);
  const isRestoring = ref(false);

  const isAuthenticated = computed(() => !!token.value && !!user.value);

  const setToken = (newToken) => {
    token.value = newToken;
    if (newToken) {
      sessionStorage.setItem('token', newToken);
    } else {
      sessionStorage.removeItem('token');
    }
  };

  const setUser = (userData) => {
    user.value = userData;
    // Пользователя не храним в sessionStorage - загружаем из API при восстановлении
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
    // sessionStorage очищается автоматически при закрытии вкладки
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
      // Если токен невалидный или API недоступен, очищаем сессию
      if (error.response?.status === 401 || error.response?.status === 404) {
        logout();
      } else {
        // При других ошибках (например, сеть) используем данные из токена как fallback
        try {
          const payload = JSON.parse(atob(token.value.split('.')[1]));
          setUser({
            userId: payload.userId,
            phone: payload.phone
          });
        } catch (e) {
          logout();
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
