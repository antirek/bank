import dotenv from 'dotenv';

// Загружаем .env из текущей рабочей директории (директория приложения, которое импортирует конфиг)
dotenv.config();

const DEFAULT_MMS3_API = 'http://localhost:3005/api';

/**
 * Tenant MMS3 API: axios вызывает пути `/users`, `/dialogs` относительно baseURL.
 * Если в env задан только origin (https://host) без /api — Express отвечает «Cannot POST /users».
 */
function normalizeMms3ApiUrl(url) {
  const raw = String(url || '').trim();
  const s = raw.replace(/\/+$/, '') || DEFAULT_MMS3_API;
  if (!/^https?:\/\//i.test(s)) {
    return s;
  }
  try {
    const u = new URL(s);
    if (u.pathname === '/' || u.pathname === '') {
      return `${u.origin}/api`.replace(/\/+$/, '');
    }
  } catch {
    /* ignore */
  }
  return s;
}

export const config = {
  apps: {
    userApi: {
      port: process.env.USER_API_PORT || 3101,
    },
    authApi: {
      port: process.env.AUTH_API_PORT || 3102,
    },
    wsServer: {
      port: Number(process.env.WS_SERVER_PORT) || 3103,
    },
  },

  /** AMQP URL для подписки на MMS3 exchange `chat3_updates` (ws-server). */
  rabbitmqAmqp: process.env.RABBITMQ_AMQP || 'amqp://rmuser:rmpassword@192.168.95.8:5672',
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/bank',

  jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  port: process.env.PORT,
  corsOrigin: process.env.CORS_ORIGIN || process.env.AUTH_UI_ORIGIN || 'http://localhost:5174',

  mms3: {
    apiUrl: normalizeMms3ApiUrl(process.env.MMS3_API_URL || DEFAULT_MMS3_API),
    apiKey: process.env.MMS3_API_KEY || 'chat3_f3d5f7101d9b1f56284c648e107630f30ed6444883d9d91d0fc74e04120fdd98',
    tenantId: process.env.MMS3_TENANT_ID || 'tnt_default',
  },
};

export default config;
