import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
  logout,
} from './auth.controller';
import { validateBody } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rateLimiter';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '@clientflow/shared';

const router = Router();

router.post('/register', authLimiter, validateBody(registerSchema), register);
router.post('/login', authLimiter, validateBody(loginSchema), login);
router.post('/refresh', refreshToken);
router.post('/forgot-password', authLimiter, validateBody(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validateBody(resetPasswordSchema), resetPassword);
router.post('/logout', logout);

// Protected routes
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, validateBody(changePasswordSchema), changePassword);

export default router;
