import express from 'express';
import * as authController from '../controllers/authController.js';

const router = express.Router();

router.post('/send-code', authController.sendCode);
router.post('/verify-code', authController.verifyCode);

export default router;
