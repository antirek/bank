#!/usr/bin/env bash
set -e

# Важно: экспортируем, чтобы значения были доступны всем подпроцессам (user-api/auth-api и т.д.)
# Для mms3 нужен API-префикс /api, иначе получаем 404 на /dialogs
export MMS3_API_URL="${MMS3_API_URL:-https://tubo-mms3-tenant-api.services.mobilon.ru/api}"
export MMS3_API_KEY="${MMS3_API_KEY:-chat3_de2b79b6159abaf8cb1145ec95b8136146483d1d34770236014932e13a327fc1}"
export MMS3_TENANT_ID="${MMS3_TENANT_ID:-tnt_default}"

# Порты сервисов
USER_API_PORT="${USER_API_PORT:-3101}"
AUTH_API_PORT="${AUTH_API_PORT:-3102}"
USER_UI_PORT="${USER_UI_PORT:-5173}"
AUTH_UI_PORT="${AUTH_UI_PORT:-5174}"
WS_SERVER_PORT="${WS_SERVER_PORT:-3103}"
OWNER_PWA_PORT="${OWNER_PWA_PORT:-5175}"

# LAN: Vite слушает этот адрес; VITE_* — редиректы между UI (auth → user/owner).
DEV_LAN_HOST="${DEV_LAN_HOST:-192.168.0.42}"
export DEV_SERVER_HOST="${DEV_SERVER_HOST:-$DEV_LAN_HOST}"
export VITE_USER_UI_URL="${VITE_USER_UI_URL:-http://${DEV_LAN_HOST}:${USER_UI_PORT}}"
export VITE_AUTH_UI_URL="${VITE_AUTH_UI_URL:-http://${DEV_LAN_HOST}:${AUTH_UI_PORT}}"
export VITE_OWNER_APP_PUBLIC_URL="${VITE_OWNER_APP_PUBLIC_URL:-http://${DEV_LAN_HOST}:${OWNER_PWA_PORT}}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT"

kill_port() {
  local port=$1
  local name=$2
  if command -v lsof >/dev/null 2>&1; then
    local pids
    pids=$(lsof -ti ":$port" 2>/dev/null || true)
    if [ -n "$pids" ]; then
      echo "Порт $port ($name): завершаем процессы: $pids"
      echo "$pids" | xargs kill -9 2>/dev/null || true
      sleep 1
    fi
  elif command -v fuser >/dev/null 2>&1; then
    if fuser -k "$port/tcp" 2>/dev/null; then
      echo "Порт $port ($name): процессы завершены (fuser)"
      sleep 1
    fi
  else
    echo "Не найден lsof или fuser, порт $port не очищаем"
  fi
}

echo "=== Проверка портов и завершение старых процессов ==="
kill_port "$USER_API_PORT" "user-api"
kill_port "$AUTH_API_PORT" "auth-api"
kill_port "$USER_UI_PORT" "user-ui"
kill_port "$AUTH_UI_PORT" "auth-ui"
kill_port "$WS_SERVER_PORT" "ws-server"
kill_port "$OWNER_PWA_PORT" "owner-pwa"

echo ""
echo "=== Сборка UI ==="
npm run build:ui

echo ""
echo "=== Запуск всех сервисов (Vite: ${DEV_SERVER_HOST}) ==="
echo "  user-ui:    http://${DEV_LAN_HOST}:${USER_UI_PORT}"
echo "  auth-ui:    http://${DEV_LAN_HOST}:${AUTH_UI_PORT}"
echo "  owner-pwa:  http://${DEV_LAN_HOST}:${OWNER_PWA_PORT}"
npm run dev:all
