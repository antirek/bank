# --- Stage 1: build frontend ---
FROM node:20-alpine AS frontend-build
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages ./packages
COPY packages-ui ./packages-ui
COPY packages-shared ./packages-shared

# Общие URL для встройки в user-ui / auth-ui / owner-pwa (переопределите при деплое)
ARG VITE_USER_UI_URL=http://localhost:3101
ARG VITE_AUTH_UI_URL=http://localhost:3102
ARG VITE_OWNER_APP_PUBLIC_URL=http://localhost:3105
# Owner на отдельном origin → абсолютные URL до user-api и ws-server
ARG VITE_OWNER_API_BASE_URL=http://localhost:3101/api
ARG VITE_OWNER_WS_URL=ws://localhost:3103/ws

ENV VITE_USER_UI_URL=$VITE_USER_UI_URL \
    VITE_AUTH_UI_URL=$VITE_AUTH_UI_URL \
    VITE_OWNER_APP_PUBLIC_URL=$VITE_OWNER_APP_PUBLIC_URL

RUN npm ci --ignore-scripts --include=dev

# Клиентский UI и auth: тот же origin, что и API
ENV VITE_API_BASE_URL=/api
RUN npm run build:user-ui && npm run build:auth-ui

# Owner PWA (поддомен / отдельный порт)
ENV VITE_API_BASE_URL=$VITE_OWNER_API_BASE_URL \
    VITE_WS_URL=$VITE_OWNER_WS_URL
RUN npm run build -w @boqq/owner-pwa

# --- Stage 2: app (Node) — user-api / auth-api / owner-api (статика в packages/owner-pwa/public) ---
FROM node:20-alpine AS app
WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY packages ./packages
COPY packages-ui ./packages-ui
COPY packages-shared ./packages-shared

RUN npm ci --omit=dev

COPY --from=frontend-build /app/packages-ui/user-ui/dist ./packages/user-api/public
COPY --from=frontend-build /app/packages-ui/auth-ui/dist ./packages/auth-api/public
COPY --from=frontend-build /app/packages/owner-pwa/public ./packages/owner-pwa/public

WORKDIR /app
USER node
