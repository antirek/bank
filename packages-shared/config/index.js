import dotenv from 'dotenv';

// Загружаем .env из текущей рабочей директории (директория приложения, которое импортирует конфиг)
dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/bank',

  jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  port: process.env.PORT,
  corsOrigin: process.env.CORS_ORIGIN || process.env.AUTH_UI_ORIGIN || 'http://localhost:5174',

  mms3: {
    apiUrl: process.env.MMS3_API_URL || 'http://localhost:3005/api',
    apiKey: process.env.MMS3_API_KEY || 'chat3_f3d5f7101d9b1f56284c648e107630f30ed6444883d9d91d0fc74e04120fdd98',
    tenantId: process.env.MMS3_TENANT_ID || 'tnt_default',
  },
};

export default config;
