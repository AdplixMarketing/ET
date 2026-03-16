import { Router } from 'express';
import { register, login, getMe, updateMe, verifyEmail, forgotPassword, resetPassword } from '../controllers/auth.controller.js';
import authenticate from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateMe);
router.get('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
