/** Базовый URL страницы входа (auth-ui), без завершающего /. */
export function getAuthUiBase() {
  return (import.meta.env.VITE_AUTH_UI_URL || 'http://localhost:5174').replace(/\/$/, '');
}

/**
 * Типичная ошибка деплоя: auth-ui раздаётся с того же origin и пути /, что и user-ui —
 * редирект открывает снова главную с «Bank».
 */
export function isAuthUiSameAppRoot() {
  if (typeof window === 'undefined') return false;
  const raw = (import.meta.env.VITE_AUTH_UI_URL || '').trim();
  if (!raw) return true;
  try {
    const a = new URL(raw.includes('://') ? raw : `https://${raw}`);
    const path = (a.pathname || '/').replace(/\/$/, '') || '/';
    return a.origin === window.location.origin && path === '/';
  } catch {
    return true;
  }
}
