/**
 * Публичный JSON для user-ui (редиректы на auth, WS и т.д.).
 * Задаётся env на user-api — без пересборки статики.
 */
export function getUserApiPublicConfigPayload() {
  const authUiUrl = process.env.PUBLIC_AUTH_UI_URL?.trim();
  const userUiUrl = process.env.PUBLIC_USER_UI_URL?.trim();
  const wsUrl = process.env.PUBLIC_WS_URL?.trim();
  const ownerAppPublicUrl = process.env.PUBLIC_OWNER_APP_URL?.trim();

  const out = {};
  if (authUiUrl) out.authUiUrl = authUiUrl;
  if (userUiUrl) out.userUiUrl = userUiUrl;
  if (wsUrl) out.wsUrl = wsUrl;
  if (ownerAppPublicUrl) out.ownerAppPublicUrl = ownerAppPublicUrl;
  return out;
}
