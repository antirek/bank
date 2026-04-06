/**
 * Публичные URL для страницы входа (auth-ui): редирект после успешного кода.
 * Задаются env на auth-api, без пересборки фронта.
 */
export function getPublicConfigPayload() {
  const userUiUrl = process.env.PUBLIC_USER_UI_URL?.trim();
  const ownerAppPublicUrl = process.env.PUBLIC_OWNER_APP_URL?.trim();
  const out = {};
  if (userUiUrl) out.userUiUrl = userUiUrl;
  if (ownerAppPublicUrl) out.ownerAppPublicUrl = ownerAppPublicUrl;
  return out;
}
