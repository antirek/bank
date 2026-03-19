import jwt from 'jsonwebtoken';
import SmsCode from '@boqq/shared-models/SmsCode.js';
import User from '@boqq/shared-models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const generateSmsCode = () => '1234';

export const sendSmsCode = async (phone) => {
  const code = generateSmsCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await SmsCode.deleteMany({ phone });
  const smsCode = new SmsCode({ phone, code, expiresAt });
  await smsCode.save();

  if (process.env.NODE_ENV === 'development') {
    console.log(`SMS Code for ${phone}: ${code}`);
  }
  return { success: true, message: 'SMS code sent' };
};

export const verifySmsCode = async (phone, code) => {
  const smsCode = await SmsCode.findOne({
    phone,
    usedAt: null,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  if (!smsCode) {
    return { success: false, error: 'Invalid or expired code' };
  }
  if (smsCode.attempts >= 5) {
    return { success: false, error: 'Too many attempts. Please request a new code' };
  }
  if (smsCode.code !== code) {
    smsCode.attempts += 1;
    await smsCode.save();
    return { success: false, error: 'Invalid code' };
  }

  smsCode.usedAt = new Date();
  await smsCode.save();

  let user = await User.findOne({ phone });
  if (!user) {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    user = new User({ userId, phone, name: '', lastLoginAt: new Date() });
    await user.save();
  } else {
    user.lastLoginAt = new Date();
    await user.save();
  }

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
