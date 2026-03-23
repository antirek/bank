#!/usr/bin/env bash
set -e

# Порты сервисов
USER_API_PORT="${USER_API_PORT:-3101}"
AUTH_API_PORT="${AUTH_API_PORT:-3102}"
USER_UI_PORT="${USER_UI_PORT:-5173}"
AUTH_UI_PORT="${AUTH_UI_PORT:-5174}"

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

echo ""
echo "=== Сборка UI ==="
npm run build:ui

echo ""
echo "=== Запуск всех сервисов ==="
npm run dev:all
