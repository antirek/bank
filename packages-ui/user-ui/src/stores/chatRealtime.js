import { defineStore } from 'pinia';
import { playIncomingMessageSound } from '../utils/incomingMessageSound.js';

function buildWsUrl(token) {
  const explicit = import.meta.env.VITE_WS_URL;
  if (explicit) {
    const base = explicit.replace(/\/$/, '');
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}token=${encodeURIComponent(token)}`;
  }
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/ws?token=${encodeURIComponent(token)}`;
}

export const useChatRealtimeStore = defineStore('chatRealtime', () => {
  let ws = null;
  let reconnectTimer = null;
  let manualClose = false;
  let lastToken = null;
  const listeners = new Set();

  function disconnect() {
    manualClose = true;
    lastToken = null;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (ws) {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onclose = null;
      ws.onerror = null;
      try {
        ws.close();
      } catch (_) {
        /* ignore */
      }
      ws = null;
    }
  }

  function connect(token) {
    if (!token) {
      disconnect();
      return;
    }

    lastToken = token;
    manualClose = false;

    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    if (ws) {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onclose = null;
      ws.onerror = null;
      try {
        ws.close();
      } catch (_) {
        /* ignore */
      }
      ws = null;
    }

    const url = buildWsUrl(token);
    ws = new WebSocket(url);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (
          msg.type === 'message.new' &&
          msg.message &&
          msg.message.isOwn === false
        ) {
          playIncomingMessageSound();
        }
        listeners.forEach((fn) => {
          try {
            fn(msg);
          } catch (e) {
            console.error('[chatRealtime] listener error', e);
          }
        });
      } catch (e) {
        console.error('[chatRealtime] parse error', e);
      }
    };

    ws.onclose = () => {
      ws = null;
      if (manualClose || !lastToken) return;
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        if (lastToken && !manualClose) connect(lastToken);
      }, 3000);
    };
  }

  function subscribe(handler) {
    listeners.add(handler);
    return () => listeners.delete(handler);
  }

  return { connect, disconnect, subscribe };
});
