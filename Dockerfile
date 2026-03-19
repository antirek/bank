# --- Stage 1: build frontend ---
FROM node:20-alpine AS frontend-build
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages ./packages
COPY packages-ui ./packages-ui
COPY packages-shared ./packages-shared

RUN npm ci --ignore-scripts && \
  npm run build:user-ui

# --- Stage 2: app (user-api + static frontend) ---
FROM node:20-alpine AS app
WORKDIR /app

ENV NODE_ENV=production
# user-api default port (override with PORT)
EXPOSE 3101

COPY package.json package-lock.json ./
COPY packages ./packages
COPY packages-ui ./packages-ui
COPY packages-shared ./packages-shared

RUN npm ci --omit=dev

# SPA from frontend build
COPY --from=frontend-build /app/packages-ui/user-ui/dist ./packages/user-api/public

# Run from repo root so workspace deps (@boqq/shared) resolve
WORKDIR /app
USER node
CMD ["npm", "run", "start:user-api"]
