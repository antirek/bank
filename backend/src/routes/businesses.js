import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as businessController from '../controllers/businessController.js';

const router = express.Router();

router.get('/', businessController.getBusinesses);
router.get('/slug/:slug', businessController.getBusinessBySlug);
router.get('/:id', businessController.getBusinessById);
router.post('/', authenticate, businessController.createBusiness); // Требует авторизации
router.put('/:id', authenticate, businessController.updateBusiness); // Требует авторизации

export default router;
