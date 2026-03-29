import { Router } from 'express';
import { UserController } from './controller';
import { authenticateToken, requireRole } from '../auth/middleware';
import { asyncHandler } from './utils';

const router = Router();
const userController = new UserController();

// User profile routes (authenticated users)
router.get('/profile', authenticateToken, asyncHandler(userController.getProfile));
router.put('/profile', authenticateToken, asyncHandler(userController.updateProfile));

// Admin routes (admin only)
router.get('/all', authenticateToken, requireRole('admin'), asyncHandler(userController.getAllUsers));
router.get('/:userId', authenticateToken, requireRole('admin'), asyncHandler(userController.getUserById));
router.put('/:userId', authenticateToken, requireRole('admin'), asyncHandler(userController.updateUser));
router.delete('/:userId', authenticateToken, requireRole('admin'), asyncHandler(userController.deleteUser));

// Points management (admin only)
router.post('/:userId/points/add', authenticateToken, requireRole('admin'), asyncHandler(userController.addPoints));
router.post('/:userId/points/deduct', authenticateToken, requireRole('admin'), asyncHandler(userController.deductPoints));

export { router as userRoutes };
