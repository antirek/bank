# --- Stage 1: build frontend ---
FROM node:20-alpine AS frontend-build
WORKDIR /app

# Домены/URL для UI — задаются при сборке: docker build --build-arg VITE_AUTH_UI_URL=...
# Vite подставляет их в бандл на этапе build:ui
ARG VITE_AUTH_UI_URL
ARG VITE_USER_UI_URL
ARG VITE_AUTH_API_URL
ENV VITE_AUTH_UI_URL=$VITE_AUTH_UI_URL
ENV VITE_USER_UI_URL=$VITE_USER_UI_URL
ENV VITE_AUTH_API_URL=$VITE_AUTH_API_URL

COPY package.json package-lock.json ./
COPY packages ./packages
COPY packages-ui ./packages-ui
COPY packages-shared ./packages-shared

RUN npm ci --ignore-scripts && \
  npm run build:ui

# --- Stage 2: app (user-api + static frontend) ---
FROM node:20-alpine AS app
WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY packages ./packages
COPY packages-ui ./packages-ui
COPY packages-shared ./packages-shared

RUN npm ci --omit=dev

# SPA from frontend build
COPY --from=frontend-build /app/packages-ui/user-ui/dist ./packages/user-api/public
COPY --from=frontend-build /app/packages-ui/auth-ui/dist ./packages/auth-api/public

WORKDIR /app
USER node
