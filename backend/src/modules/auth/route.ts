import { Router } from 'express';
import { AuthController } from './controller';
import { authenticateToken } from './middleware';
import { asyncHandler } from './utils';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));

// Protected routes
router.get('/profile', authenticateToken, asyncHandler(authController.getProfile));

export { router as authRoutes };
