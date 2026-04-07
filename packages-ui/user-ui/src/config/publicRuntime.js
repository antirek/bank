import { reactive } from 'vue';

function trimSlash(s) {
  return String(s || '').replace(/\/$/, '');
}

export const userPublicRuntime = reactive({
  authUiUrl: trimSlash(import.meta.env.VITE_AUTH_UI_URL || 'http://localhost:5174'),
  userUiUrl: trimSlash(import.meta.env.VITE_USER_UI_URL || ''),
  wsUrl: trimSlash(import.meta.env.VITE_WS_URL || ''),
  ownerAppPublicUrl: trimSlash(import.meta.env.VITE_OWNER_APP_PUBLIC_URL || '')
});

export function applyUserPublicRuntime(json) {
  if (!json || typeof json !== 'object') return;
  if (json.authUiUrl) userPublicRuntime.authUiUrl = trimSlash(String(json.authUiUrl));
  if (json.userUiUrl) userPublicRuntime.userUiUrl = trimSlash(String(json.userUiUrl));
  if (json.wsUrl !== undefined) {
    userPublicRuntime.wsUrl = json.wsUrl ? trimSlash(String(json.wsUrl)) : '';
  }
  if (json.ownerAppPublicUrl) {
    userPublicRuntime.ownerAppPublicUrl = trimSlash(String(json.ownerAppPublicUrl));
  }
}

export async function loadUserPublicRuntime() {
  try {
    const res = await fetch('/public-config.json', { cache: 'no-store' });
    if (!res.ok) return;
    applyUserPublicRuntime(await res.json());
  } catch {
    /* dev без user-api или до прокси */
  }
}

/** Явный WS URL для chatRealtime: рантайм → Vite */
export function getWsUrlOverride() {
  const r = userPublicRuntime.wsUrl?.trim();
  if (r) return r;
  const v = import.meta.env.VITE_WS_URL;
  return v != null && String(v).trim() !== '' ? String(v).trim().replace(/\/$/, '') : '';
}
