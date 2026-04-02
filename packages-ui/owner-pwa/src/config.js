/**
 * Все публичные URL и заголовки для owner-PWA задаются через переменные окружения Vite (VITE_*).
 * См. `.env.example` в корне пакета.
 */

function trimSlash(s) {
  return String(s || '').replace(/\/$/, '');
}

export const ownerAppConfig = {
  appTitle: import.meta.env.VITE_APP_TITLE || 'Boqq — чаты',

  /** База user-api (как @boqq/api-client в user-ui). */
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',

  /**
   * Публичный origin этого приложения (без слэша в конце).
   * Нужен для ?return= после входа через auth-ui (тот же JWT, что и у клиентского приложения).
   */
  ownerPublicOrigin: trimSlash(
    import.meta.env.VITE_OWNER_APP_PUBLIC_URL ||
      (import.meta.env.DEV ? 'http://localhost:5175' : '')
  ),

  authUiUrl: trimSlash(
    import.meta.env.VITE_AUTH_UI_URL ||
      (import.meta.env.DEV ? 'http://localhost:5174' : '')
  ),

  /** Пусто в dev → WebSocket на тот же хост, путь /ws (прокси Vite). */
  wsUrl: trimSlash(import.meta.env.VITE_WS_URL || '')
};

/**
 * В production при старте проверяем, что критичные переменные заданы (иначе приложение не монтируется).
 */
export function assertOwnerAppConfig() {
  if (!import.meta.env.PROD) return;

  const c = ownerAppConfig;
  const problems = [];

  if (!c.ownerPublicOrigin || !/^https?:\/\//i.test(c.ownerPublicOrigin)) {
    problems.push('VITE_OWNER_APP_PUBLIC_URL (https://owner.…)');
  }
  if (!c.authUiUrl || !/^https?:\/\//i.test(c.authUiUrl)) {
    problems.push('VITE_AUTH_UI_URL');
  }
  if (
    !c.apiBaseUrl ||
    (!/^https?:\/\//i.test(c.apiBaseUrl) && c.apiBaseUrl !== '/api')
  ) {
    problems.push('VITE_API_BASE_URL (абсолютный https://…/api или /api за тем же origin)');
  }

  const apiIsAbsolute = /^https?:\/\//i.test(c.apiBaseUrl);
  if (apiIsAbsolute && !c.wsUrl) {
    problems.push(
      'VITE_WS_URL (wss://… при вынесенном API на другой хост; иначе WS по относительному пути не достучится)'
    );
  }
  if (c.wsUrl && !/^wss?:\/\//i.test(c.wsUrl)) {
    problems.push('VITE_WS_URL (должен начинаться с ws:// или wss://)');
  }

  if (problems.length) {
    const msg = `[owner-pwa] Задайте в .env для production:\n- ${problems.join('\n- ')}`;
    console.error(msg);
    throw new Error(msg);
  }
}
