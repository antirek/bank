import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as businessController from '../controllers/businessController.js';
import * as dialogController from '../controllers/dialogController.js';
import * as newsController from '../controllers/newsController.js';

const router = express.Router();

router.get('/', businessController.getBusinesses);
router.get('/slug/:slug', businessController.getBusinessBySlug);
// Роуты диалогов должны быть ДО /:id, чтобы избежать конфликта
router.post('/:businessId/dialogs/start', authenticate, dialogController.startDialog);
router.get('/:businessId/dialogs', authenticate, dialogController.getBusinessDialogs);
// Роуты новостей должны быть ДО /:id, чтобы избежать конфликта
router.get('/:businessId/news', newsController.getBusinessNews);
router.post('/:businessId/news', authenticate, newsController.createNews);
router.put('/:businessId/news/:newsId', authenticate, newsController.updateNews);
router.delete('/:businessId/news/:newsId', authenticate, newsController.deleteNews);
// Роут получения бизнеса по ID должен быть последним
router.get('/:id', businessController.getBusinessById);
router.post('/', authenticate, businessController.createBusiness); // Требует авторизации
router.put('/:id', authenticate, businessController.updateBusiness); // Требует авторизации

export default router;
