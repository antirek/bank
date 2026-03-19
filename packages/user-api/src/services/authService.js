import jwt from 'jsonwebtoken';
import { config } from '@boqq/shared-models/config';

/** Проверка JWT (токен выдаётся auth-api, тот же секрет). */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    return null;
  }
};
