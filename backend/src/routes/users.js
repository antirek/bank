import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as userController from '../controllers/userController.js';

const router = express.Router();

router.get('/', userController.getUsers);
router.get('/:userId', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:userId', authenticate, userController.updateUser); // Требует авторизации

export default router;
