import { Router } from 'express';
import { AchievementController } from './controller';
import { authenticateToken, authorize } from '../auth/middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';

const router = Router();

// Public routes
router.get('/leaderboard', asyncHandler(AchievementController.getAchievementLeaderboard));

// Protected routes
router.get('/my', authenticateToken, asyncHandler(AchievementController.getMyAchievements));
router.get('/:id', authenticateToken, asyncHandler(AchievementController.getAchievementById));

// Admin routes
router.post('/', authenticateToken, authorize('admin'), asyncHandler(AchievementController.createAchievement));
router.get('/', authenticateToken, authorize('admin'), asyncHandler(AchievementController.getAllAchievements));
router.put('/:id', authenticateToken, authorize('admin'), asyncHandler(AchievementController.updateAchievement));
router.delete('/:id', authenticateToken, authorize('admin'), asyncHandler(AchievementController.deleteAchievement));

export default router;
