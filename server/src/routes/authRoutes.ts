import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { authenticateJWT } from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', authenticateJWT, getMe);

export default router;
