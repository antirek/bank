import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3102;
const CORS_ORIGIN = process.env.CORS_ORIGIN || process.env.AUTH_UI_ORIGIN || 'http://localhost:5174';

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
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Auth API running on port ${PORT}`);
    });
  } catch (e) {
    console.error('Failed to start:', e);
    process.exit(1);
  }
};

start();
