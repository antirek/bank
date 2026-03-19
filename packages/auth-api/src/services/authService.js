import jwt from 'jsonwebtoken';
import { config } from '@boqq/shared/config';
import { SmsCode, User } from '@boqq/shared/models';

export const generateSmsCode = () => '1234';

export const sendSmsCode = async (phone) => {
  const code = generateSmsCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await SmsCode.deleteMany({ phone });
  const smsCode = new SmsCode({ phone, code, expiresAt });
  await smsCode.save();

  if (config.nodeEnv === 'development') {
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
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
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
