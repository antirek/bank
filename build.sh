#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

TAG="${TAG:-0.0.10}"

# Публичные URL для встройки в UI при docker build (см. deploy/.env.build.example)
if [ -f deploy/.env.build ]; then
  set -a
  # shellcheck source=/dev/null
  . deploy/.env.build
  set +a
fi

: "${VITE_USER_UI_URL:=http://localhost:3101}"
: "${VITE_AUTH_UI_URL:=http://localhost:3102}"
: "${VITE_OWNER_APP_PUBLIC_URL:=http://localhost:3105}"
: "${VITE_OWNER_API_BASE_URL:=http://localhost:3101/api}"
: "${VITE_OWNER_WS_URL:=ws://localhost:3103/ws}"

docker build \
  --build-arg "VITE_USER_UI_URL=$VITE_USER_UI_URL" \
  --build-arg "VITE_AUTH_UI_URL=$VITE_AUTH_UI_URL" \
  --build-arg "VITE_OWNER_APP_PUBLIC_URL=$VITE_OWNER_APP_PUBLIC_URL" \
  --build-arg "VITE_OWNER_API_BASE_URL=$VITE_OWNER_API_BASE_URL" \
  --build-arg "VITE_OWNER_WS_URL=$VITE_OWNER_WS_URL" \
  -t "antirek/boqq:$TAG" .

docker push "antirek/boqq:$TAG"
