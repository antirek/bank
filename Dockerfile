# --- Stage 1: build frontend ---
FROM node:20-alpine AS frontend-build
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages ./packages
COPY packages-ui ./packages-ui
COPY packages-shared ./packages-shared

# Публичные URL не вшиваем: user-ui — GET /public-config.json (user-api),
# auth-ui — /public-config.json (auth-api), owner-pwa — /runtime-config.json (owner-api).
# Здесь только fallback для dev-сборки (/api с того же origin, что отдаёт SPA).
RUN npm ci --ignore-scripts --include=dev

ENV VITE_API_BASE_URL=/api
RUN npm run build:user-ui && npm run build:auth-ui

# Owner: до рантайма в бандле только относительные пути; реальные URL подставляет owner-api.
ENV VITE_WS_URL=
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
