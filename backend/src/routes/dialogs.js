import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as dialogController from '../controllers/dialogController.js';

const router = express.Router();

// Все routes требуют аутентификации
router.use(authenticate);

// Получить мои диалоги (для пользователя)
router.get('/dialogs/me', dialogController.getMyDialogs);

// Получить диалог по ID
router.get('/dialogs/:dialogId', dialogController.getDialog);

// Получить сообщения диалога
router.get('/dialogs/:dialogId/messages', dialogController.getDialogMessages);

// Отправить сообщение
router.post('/dialogs/:dialogId/messages', dialogController.sendMessage);

// Отметить как прочитанный
router.patch('/dialogs/:dialogId/read', dialogController.markAsRead);

export default router;
