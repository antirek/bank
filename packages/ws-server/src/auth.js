import jwt from 'jsonwebtoken';
import { config } from '@boqq/shared/config';

export function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch {
    return null;
  }
}
