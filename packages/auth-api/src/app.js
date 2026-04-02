import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { config } from '@boqq/shared/config';
import { ready } from '@boqq/shared/models';
import authRoutes from './routes/auth.js';

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

// В production отдаём собранный auth-ui (SPA)
const staticDir = path.join(__dirname, '../public');
if (config.nodeEnv === 'production' && existsSync(staticDir)) {
  app.use(express.static(staticDir));
}

app.get('/health', (req, res) => res.json({ ok: true }));

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
    });
  } catch (e) {
    console.error('Failed to start:', e);
    process.exit(1);
  }
};

start();
