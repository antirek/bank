/**
 * Публичные URL для страницы входа (auth-ui): редирект после успешного кода.
 * Задаются env на auth-api, без пересборки фронта.
 */
export function getPublicConfigPayload() {
  const userUiUrl = process.env.PUBLIC_USER_UI_URL?.trim();
  const ownerAppPublicUrl = process.env.PUBLIC_OWNER_APP_URL?.trim();
  /** База для axios (пути /auth/...). Пусто в JSON → auth-ui шлёт на тот же origin. */
  const apiBaseUrl = process.env.PUBLIC_AUTH_API_BASE_URL?.trim();
  const out = {};
  if (userUiUrl) out.userUiUrl = userUiUrl;
  if (ownerAppPublicUrl) out.ownerAppPublicUrl = ownerAppPublicUrl;
  if (apiBaseUrl) out.apiBaseUrl = apiBaseUrl;
  return out;
}
