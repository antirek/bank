import jwt from 'jsonwebtoken';
import SmsCode from '../models/SmsCode.js';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Генерация тестового кода (всегда 1234)
export const generateSmsCode = () => {
  return '1234';
};

// Отправка SMS кода (тестовая версия)
export const sendSmsCode = async (phone) => {
  const code = generateSmsCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

  // Удаляем старые коды для этого телефона
  await SmsCode.deleteMany({ phone });

  // Создаем новый код
  const smsCode = new SmsCode({
    phone,
    code,
    expiresAt
  });

  await smsCode.save();

  // В тестовом режиме возвращаем код (в продакшене не возвращаем)
  if (process.env.NODE_ENV === 'development') {
    console.log(`SMS Code for ${phone}: ${code}`);
  }

  return { success: true, message: 'SMS code sent' };
};

// Верификация SMS кода
export const verifySmsCode = async (phone, code) => {
  const smsCode = await SmsCode.findOne({ 
    phone, 
    usedAt: null,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  if (!smsCode) {
    return { success: false, error: 'Invalid or expired code' };
  }

  // Проверяем количество попыток
  if (smsCode.attempts >= 5) {
    return { success: false, error: 'Too many attempts. Please request a new code' };
  }

  // Проверяем код
  if (smsCode.code !== code) {
    smsCode.attempts += 1;
    await smsCode.save();
    return { success: false, error: 'Invalid code' };
  }

  // Помечаем код как использованный
  smsCode.usedAt = new Date();
  await smsCode.save();

  // Находим или создаем пользователя
  let user = await User.findOne({ phone });
  
  if (!user) {
    // Создаем нового пользователя
    user = new User({
      userId: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      phone,
      name: '',
      lastLoginAt: new Date()
    });
    await user.save();
  } else {
    // Обновляем время последнего входа
    user.lastLoginAt = new Date();
    await user.save();
  }

  // Генерируем JWT токен
  const token = jwt.sign(
    { userId: user.userId, phone: user.phone },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return { 
    success: true, 
    token,
    user: {
      userId: user.userId,
      phone: user.phone,
      name: user.name,
      avatar: user.avatar
    }
  };
};

// Верификация JWT токена
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};
