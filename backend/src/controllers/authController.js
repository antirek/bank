import { sendSmsCode, verifySmsCode } from '../services/authService.js';

export const sendCode = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Валидация формата телефона (базовая)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    const result = await sendSmsCode(phone);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyCode = async (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ error: 'Phone and code are required' });
    }

    const result = await verifySmsCode(phone, code);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      data: {
        token: result.token,
        user: result.user
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
