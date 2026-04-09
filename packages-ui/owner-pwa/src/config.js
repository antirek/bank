import { reactive } from 'vue';
import { setApiBaseURL } from '@boqq/api-client';

function trimSlash(s) {
  return String(s || '').replace(/\/$/, '');
}

function buildDefaults() {
  const apiEnv = import.meta.env.VITE_API_BASE_URL;
  const apiBaseUrl =
    apiEnv != null && String(apiEnv).trim() !== '' ? String(apiEnv).trim() : '/api';

  return {
    appTitle:
      (import.meta.env.VITE_APP_TITLE && String(import.meta.env.VITE_APP_TITLE)) || 'Boqq — чаты',

    apiBaseUrl,

    ownerPublicOrigin: trimSlash(
      import.meta.env.VITE_OWNER_APP_PUBLIC_URL ||
        (import.meta.env.DEV ? 'http://localhost:5175' : '')
    ),

    authUiUrl: trimSlash(
      import.meta.env.VITE_AUTH_UI_URL || (import.meta.env.DEV ? 'http://localhost:5174' : '')
    ),

    wsUrl: trimSlash(import.meta.env.VITE_WS_URL || '')
  };
}

/** Реактивно обновляется после fetch /runtime-config.json */
export const ownerAppConfig = reactive(buildDefaults());

setApiBaseURL(ownerAppConfig.apiBaseUrl);

/**
 * Подмешивает ответ owner-api (поля только с непустыми значениями).
 * @param {Record<string, string|undefined>} json
 */
export function applyOwnerRuntimeConfig(json) {
  if (!json || typeof json !== 'object') return;
  if (json.appTitle) ownerAppConfig.appTitle = String(json.appTitle);
  if (json.publicUrl) ownerAppConfig.ownerPublicOrigin = trimSlash(String(json.publicUrl));
  if (json.authUiUrl) ownerAppConfig.authUiUrl = trimSlash(String(json.authUiUrl));
  if (json.apiBaseUrl != null && String(json.apiBaseUrl).trim() !== '') {
    ownerAppConfig.apiBaseUrl = String(json.apiBaseUrl).trim();
  }
  if (json.wsUrl !== undefined) {
    ownerAppConfig.wsUrl = json.wsUrl ? trimSlash(String(json.wsUrl)) : '';
  }
  setApiBaseURL(ownerAppConfig.apiBaseUrl);
}

export async function loadOwnerRuntimeConfig() {
  try {
    const res = await fetch('/runtime-config.json', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    applyOwnerRuntimeConfig(data);
  } catch {
    /* dev без owner-api — остаются VITE_* */
  }
}

export function assertOwnerAppConfig() {
  if (!import.meta.env.PROD) return;

  const c = ownerAppConfig;
  const problems = [];

  if (!c.ownerPublicOrigin || !/^https?:\/\//i.test(c.ownerPublicOrigin)) {
    problems.push('OWNER_PUBLIC_URL (owner-api) или VITE_OWNER_APP_PUBLIC_URL (сборка)');
  }
  if (!c.authUiUrl || !/^https?:\/\//i.test(c.authUiUrl)) {
    problems.push('OWNER_AUTH_UI_URL (owner-api) или VITE_AUTH_UI_URL');
  }
  if (!c.apiBaseUrl) {
    problems.push('OWNER_API_BASE_URL (owner-api) или VITE_API_BASE_URL');
  } else if (!/^https?:\/\//i.test(c.apiBaseUrl)) {
    problems.push(
      'OWNER_API_BASE_URL — полный URL user-api (https://…/api). Относительный /api с домена owner-pwa попадает в owner-api без REST — список бизнесов будет пустым.'
    );
  }

  const apiIsAbsolute = /^https?:\/\//i.test(c.apiBaseUrl);
  if (apiIsAbsolute && !c.wsUrl && typeof window !== 'undefined') {
    try {
      const apiOrigin = new URL(c.apiBaseUrl).origin;
      if (apiOrigin !== window.location.origin) {
        problems.push(
          'OWNER_WS_URL (owner-api) или VITE_WS_URL — нужен wss://, если API на другом origin, чем это приложение'
        );
      }
    } catch {
      problems.push('OWNER_API_BASE_URL: невалидный абсолютный URL');
    }
  }
  if (c.wsUrl && !/^wss?:\/\//i.test(c.wsUrl)) {
    problems.push('wsUrl должен начинаться с ws:// или wss://');
  }

  if (problems.length) {
    const msg = `[owner-pwa] Задайте env в owner-api или VITE_* при сборке:\n- ${problems.join('\n- ')}`;
    console.error(msg);
    throw new Error(msg);
  }
}
