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

/**
 * Частая ошибка в env: `https://woqq.ru` без пути — тогда axios даёт `/businesses` на корне сайта (SPA), а не user-api.
 * Если в URL только origin (путь `/` или пусто), добавляем суффикс `/api` как у nginx + express-openapi.
 */
export function normalizeUserApiBaseUrl(url) {
  const s = String(url || '').trim().replace(/\/+$/, '');
  if (!s || !/^https?:\/\//i.test(s)) return s;
  try {
    const u = new URL(s);
    if (u.pathname === '/' || u.pathname === '') {
      return `${u.origin}/api`.replace(/\/+$/, '');
    }
  } catch {
    /* ignore */
  }
  return s;
}

const rawInitialBase =
  typeof import.meta !== 'undefined' &&
  import.meta.env &&
  import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL
    : '/api';

const baseURL = normalizeUserApiBaseUrl(rawInitialBase) || rawInitialBase;

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/** Смена базы API после загрузки runtime-конфига (например owner-pwa с owner-api). */
export function setApiBaseURL(url) {
  if (url != null && String(url).trim() !== '') {
    api.defaults.baseURL = normalizeUserApiBaseUrl(String(url).trim());
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
