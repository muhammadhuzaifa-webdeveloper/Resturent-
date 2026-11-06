import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../../shared/http/async-handler';
import { validateBody } from '../../shared/http/validate-body';
import { authenticate } from './auth.middleware';
import { authController } from './auth.controller';
import { loginSchema, registerSchema } from './auth.validation';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts, please try again later',
    errors: [{ code: 'RATE_LIMITED' }],
  },
});

const router = Router();
router.post('/register', authLimiter, validateBody(registerSchema), asyncHandler(authController.register));
router.post('/login', authLimiter, validateBody(loginSchema), asyncHandler(authController.login));
router.post('/logout', authenticate, asyncHandler(authController.logout));

export { router as authRoutes };
