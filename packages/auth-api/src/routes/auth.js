import { sendCode, verifyCode } from '../controllers/authController.js';

export default (router) => {
  router.post('/auth/send-code', sendCode);
  router.post('/auth/verify-code', verifyCode);
};
