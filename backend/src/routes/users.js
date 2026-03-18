import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as userController from '../controllers/userController.js';
import * as newsController from '../controllers/newsController.js';

const router = express.Router();

router.get('/', userController.getUsers);
router.post('/', userController.createUser);
// Роут ленты новостей должен быть ДО /:userId, чтобы избежать конфликта
router.get('/:userId/news-feed', authenticate, newsController.getUserNewsFeed);
router.get('/:userId', userController.getUserById);
router.put('/:userId', authenticate, userController.updateUser); // Требует авторизации

export default router;
