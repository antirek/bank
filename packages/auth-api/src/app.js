import express from 'express';
import cors from 'cors';
import { config } from '@boqq/shared/config';
import { ready } from '@boqq/shared/models';
import authRoutes from './routes/auth.js';

const app = express();
const PORT = config.port || 3102;
const CORS_ORIGIN = config.corsOrigin;

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));

const router = express.Router();
authRoutes(router);
app.use(router);

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
