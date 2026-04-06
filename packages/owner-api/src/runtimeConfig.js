/**
 * Публичный JSON для owner-pwa. Задаётся переменными окружения процесса owner-api.
 */
export function getRuntimeConfigPayload() {
  const appTitle = process.env.OWNER_APP_TITLE?.trim();
  const publicUrl = process.env.OWNER_PUBLIC_URL?.trim();
  const authUiUrl = process.env.OWNER_AUTH_UI_URL?.trim();
  const apiBaseUrl = process.env.OWNER_API_BASE_URL?.trim();
  const wsUrl = process.env.OWNER_WS_URL?.trim();

  const out = {};
  if (appTitle) out.appTitle = appTitle;
  if (publicUrl) out.publicUrl = publicUrl;
  if (authUiUrl) out.authUiUrl = authUiUrl;
  if (apiBaseUrl) out.apiBaseUrl = apiBaseUrl;
  if (wsUrl) out.wsUrl = wsUrl;
  return out;
}
