import axios from 'axios';

/** После createPinia() в main приложения — чтобы Authorization совпадал с store (не только localStorage). */
let authTokenGetter = null;
export function setAuthTokenGetter(fn) {
  authTokenGetter = typeof fn === 'function' ? fn : null;
}

function resolveAuthToken() {
  try {
    const fromStore = authTokenGetter ? authTokenGetter() : null;
    if (fromStore) return fromStore;
  } catch (_) {
    /* pinia ещё не готова — падаем на storage */
  }
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

const baseURL =
  typeof import.meta !== 'undefined' &&
  import.meta.env &&
  import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL
    : '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/** Смена базы API после загрузки runtime-конфига (например owner-pwa с owner-api). */
export function setApiBaseURL(url) {
  if (url != null && String(url).trim() !== '') {
    api.defaults.baseURL = String(url).trim();
  }
}

api.interceptors.request.use(
  (config) => {
    const token = resolveAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default api;
