import { Router } from 'express';
import { UserController } from './controller';
import { authenticateToken, authorize } from '../auth/middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';

const router = Router();

// Public routes
router.get('/profile/:id', asyncHandler(UserController.getPublicProfile));

// Protected routes
router.get('/me', authenticateToken, asyncHandler(UserController.getProfile));
router.put('/me', authenticateToken, asyncHandler(UserController.updateProfile));
router.post('/me/avatar', authenticateToken, asyncHandler(UserController.uploadAvatar));
router.put('/me/password', authenticateToken, asyncHandler(UserController.changePassword));
router.delete('/me', authenticateToken, asyncHandler(UserController.deleteAccount));

// Admin routes
router.get('/', authenticateToken, authorize('admin'), asyncHandler(UserController.getAllUsers));
router.get('/:id', authenticateToken, authorize('admin'), asyncHandler(UserController.getUserById));
router.put('/:id', authenticateToken, authorize('admin'), asyncHandler(UserController.updateUser));
router.delete('/:id', authenticateToken, authorize('admin'), asyncHandler(UserController.deleteUser));

export default router;
