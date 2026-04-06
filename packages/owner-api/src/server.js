import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { getRuntimeConfigPayload } from './runtimeConfig.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../../owner-pwa/public');
const indexHtml = path.join(publicDir, 'index.html');
const PORT = Number(process.env.OWNER_API_PORT) || 3105;

if (!existsSync(indexHtml)) {
  console.error(`[owner-api] Нет сборки: ${indexHtml} — выполните npm run build:owner-pwa`);
  process.exit(1);
}

const app = express();
app.disable('x-powered-by');

app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/runtime-config.json', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.type('application/json');
  res.json(getRuntimeConfigPayload());
});

app.use(express.static(publicDir));

app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  if (path.extname(req.path)) {
    res.status(404).end();
    return;
  }
  res.sendFile(indexHtml);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`owner-api → http://0.0.0.0:${PORT} (${publicDir})`);
  if (process.env.NODE_ENV === 'production') {
    const need = ['OWNER_PUBLIC_URL', 'OWNER_AUTH_UI_URL', 'OWNER_API_BASE_URL', 'OWNER_WS_URL'];
    const miss = need.filter((k) => !process.env[k]?.trim());
    if (miss.length) {
      console.warn(`[owner-api] В production задайте env: ${miss.join(', ')}`);
    }
  }
});
