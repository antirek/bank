# --- Stage 1: build frontend ---
FROM node:20-alpine AS frontend-build
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages ./packages
COPY packages-ui ./packages-ui
COPY packages-shared ./packages-shared

RUN npm ci --ignore-scripts && \
  npm run build:frontend

# --- Stage 2: app (backend + static frontend) ---
FROM node:20-alpine AS app
WORKDIR /app

ENV NODE_ENV=production
EXPOSE 3001

COPY package.json package-lock.json ./
COPY packages ./packages
COPY packages-ui ./packages-ui
COPY packages-shared ./packages-shared

RUN npm ci --omit=dev

COPY --from=frontend-build /app/packages-ui/user-ui/dist ./packages/user-api/public

WORKDIR /app/packages/user-api
USER node
CMD ["npm", "start"]
