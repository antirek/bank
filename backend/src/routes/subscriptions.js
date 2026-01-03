import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as subscriptionController from '../controllers/subscriptionController.js';

const router = express.Router();

// Все routes требуют аутентификации
router.use(authenticate);

router.post('/businesses/:businessId/subscribe', subscriptionController.subscribeToBusiness);
router.delete('/businesses/:businessId/subscribe', subscriptionController.unsubscribeFromBusiness);
router.get('/me/subscriptions', subscriptionController.getUserSubscriptions);
router.get('/businesses/:businessId/subscribers', subscriptionController.getBusinessSubscribers);

export default router;
