import { Router } from 'express';
import { AuthController } from './controller';
import { validateRegister, validateLogin } from './middleware/validation';
import { authenticateToken } from './middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';

const router = Router();

// Public routes
router.post('/register', validateRegister, asyncHandler(AuthController.register));
router.post('/login', validateLogin, asyncHandler(AuthController.login));
router.post('/logout', asyncHandler(AuthController.logout));
router.get('/me', authenticateToken, asyncHandler(AuthController.getMe));
router.put('/me', authenticateToken, asyncHandler(AuthController.updateMe));
router.post('/forgot-password', asyncHandler(AuthController.forgotPassword));
router.post('/reset-password', asyncHandler(AuthController.resetPassword));
router.get('/verify-email/:token', asyncHandler(AuthController.verifyEmail));

// Protected routes for admin
router.get('/admin/users', authenticateToken, asyncHandler(AuthController.getAllUsers));
router.put('/admin/users/:id/role', authenticateToken, asyncHandler(AuthController.updateUserRole));
router.delete('/admin/users/:id', authenticateToken, asyncHandler(AuthController.deleteUser));

export default router;
