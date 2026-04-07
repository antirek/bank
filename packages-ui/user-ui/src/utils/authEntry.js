import { userPublicRuntime } from '../config/publicRuntime';

export function getAuthUiBase() {
  const r = userPublicRuntime.authUiUrl?.trim();
  if (r) return r.replace(/\/$/, '');
  return (import.meta.env.VITE_AUTH_UI_URL || 'http://localhost:5174').replace(/\/$/, '');
}

/**
 * Та же SPA в корне этого origin, что и клиент — вход зациклится.
 */
export function isAuthUiSameAppRoot() {
  if (typeof window === 'undefined') return false;
  const raw = getAuthUiBase();
  if (!raw) return true;
  try {
    const a = new URL(raw.includes('://') ? raw : `https://${raw}`);
    const path = (a.pathname || '/').replace(/\/$/, '') || '/';
    return a.origin === window.location.origin && path === '/';
  } catch {
    return true;
  }
}
