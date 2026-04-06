import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { config } from '@boqq/shared/config';
import { ready } from '@boqq/shared/models';
import authRoutes from './routes/auth.js';
import { getPublicConfigPayload } from './publicConfig.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = config.apps.authApi.port;
const CORS_ORIGIN = config.corsOrigin;

app.use(
  cors(
    config.nodeEnv === 'development'
      ? { origin: true }
      : { origin: CORS_ORIGIN }
  )
);
app.use(express.json());

const staticDir = path.join(__dirname, '../public');

app.get('/health', (req, res) => res.json({ ok: true }));

app.get('/public-config.json', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.type('application/json');
  res.json(getPublicConfigPayload());
});

// В production отдаём собранный auth-ui (SPA) — после /public-config.json и /health
if (config.nodeEnv === 'production' && existsSync(staticDir)) {
  app.use(express.static(staticDir));
}

const router = express.Router();
authRoutes(router);
app.use(router);

// SPA fallback: в production отдаём index.html для клиентских маршрутов
app.use((req, res, next) => {
  if (config.nodeEnv === 'production' && existsSync(staticDir)) {
    const indexHtml = path.join(staticDir, 'index.html');
    if (existsSync(indexHtml)) {
      return res.sendFile(indexHtml);
    }
  }
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

const start = async () => {
  try {
    await ready;
    app.listen(PORT, () => {
      console.log(`Auth API running on port ${PORT}`);
      if (config.nodeEnv === 'production') {
        const p = getPublicConfigPayload();
        if (!p.userUiUrl || !p.ownerAppPublicUrl) {
          console.warn(
            '[auth-api] Для корректного return после входа задайте PUBLIC_USER_UI_URL и PUBLIC_OWNER_APP_URL'
          );
        }
      }
    });
  } catch (e) {
    console.error('Failed to start:', e);
    process.exit(1);
  }
};

start();
