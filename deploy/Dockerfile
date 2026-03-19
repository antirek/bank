# --- Stage 1: build frontend ---
FROM node:20-alpine AS frontend-build
WORKDIR /app

# Копируем всё необходимое для сборки workspaces
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY packages/shared/package.json ./packages/shared/
COPY packages/api-client/package.json ./packages/api-client/
COPY packages-ui/ui/package.json ./packages-ui/ui/

COPY frontend ./frontend
COPY packages ./packages
COPY packages-ui ./packages-ui

RUN npm ci --ignore-scripts && \
  npm run build -w boqq-frontend

# --- Stage 2: backend dependencies ---
FROM node:20-alpine AS backend-deps
WORKDIR /app
COPY backend/package.json ./
RUN npm install --omit=dev

# --- Stage 3: app image ---
FROM node:20-alpine AS app
WORKDIR /app

ENV NODE_ENV=production
EXPOSE 3001

# Зависимости backend
COPY --from=backend-deps /app/node_modules ./node_modules
COPY backend/package.json ./

# Исходники backend
COPY backend/src ./src

# Собранный frontend (backend отдаёт его как статику)
COPY --from=frontend-build /app/frontend/dist ./public

USER node
CMD ["node", "src/app.js"]
