import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { config } from '@boqq/shared/config';
import { ready } from '@boqq/shared/models';
import { initialize } from 'express-openapi';
import apiDoc from './routes/api-doc.js';
import { authenticate } from './middleware/auth.js';
import { verifyToken } from './services/authService.js';
import * as userController from './controllers/userController.js';
import * as businessController from './controllers/businessController.js';
import * as dialogController from './controllers/dialogController.js';
import * as newsController from './controllers/newsController.js';
import * as subscriptionController from './controllers/subscriptionController.js';
import { getUserApiPublicConfigPayload } from './publicConfig.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = config.apps.userApi.port;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Универсально прикладываем пользователя из Bearer JWT.
// Это защищает от кейсов, когда route-level additional middleware не сработал.
app.use((req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  next();
});

const staticDir = path.join(__dirname, '../public');

/** Не отдавать index.html вместо отсутствующих .js/.css — иначе Chrome: net::ERR_BLOCKED_BY_ORB. */
const SPA_FALLBACK_SKIP =
  /\.(js|mjs|cjs|css|map|json|ico|png|jpe?g|gif|webp|svg|woff2?|ttf|eot|wasm)$/i;

app.get('/public-config.json', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.type('application/json');
  res.json(getUserApiPublicConfigPayload());
});

// В production отдаём frontend (SPA) — после /public-config.json
if (config.nodeEnv === 'production' && existsSync(staticDir)) {
  const widgetPath = path.join(staticDir, 'boqq-widget.js');
  if (!existsSync(widgetPath)) {
    console.warn(
      '[user-api] Нет файла public/boqq-widget.js — пересоберите user-ui (Vite копирует из public/). Иначе /boqq-widget.js отдастся как HTML.'
    );
  }
  app.use(express.static(staticDir));
}

const startServer = async () => {
  try {
    await ready;
    const pathsDir = path.join(__dirname, 'routes/paths');
    await initialize({
      app,
      apiDoc,
      paths: pathsDir,
      dependencies: {
        userController,
        businessController,
        dialogController,
        newsController,
        subscriptionController,
        authenticate
      },
      docsPath: '/api-docs',
      exposeApiDocs: true,
      validateApiDoc: false
    });
    // Error handling and 404 must be after routes
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(config.nodeEnv === 'development' && { stack: err.stack })
      });
    });
    app.use((req, res) => {
      // SPA fallback: в production отдаём index.html для клиентских маршрутов
      if (config.nodeEnv === 'production' && existsSync(staticDir)) {
        if (SPA_FALLBACK_SKIP.test(req.path)) {
          return res.status(404).type('text/plain').send('Not found');
        }
        const indexHtml = path.join(staticDir, 'index.html');
        if (existsSync(indexHtml)) {
          return res.sendFile(indexHtml);
        }
      }
      res.status(404).json({ error: 'Route not found' });
    });
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`OpenAPI spec: http://localhost:${PORT}/api/api-docs`);
      if (config.nodeEnv === 'production' && !process.env.PUBLIC_AUTH_UI_URL?.trim()) {
        console.warn(
          '[user-api] Задайте PUBLIC_AUTH_UI_URL — иначе user-ui возьмёт URL входа из сборки (Vite)'
        );
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
