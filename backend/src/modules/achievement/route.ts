import { Router } from 'express';
import { AchievementController } from './controller';
import { authenticateToken, requireRole } from '../auth/middleware';
import { asyncHandler } from './utils';

const router = Router();
const achievementController = new AchievementController();

// User routes (authenticated users)
router.get('/my', authenticateToken, asyncHandler(achievementController.getUserAchievements));
router.get('/my/stats', authenticateToken, asyncHandler(achievementController.getUserAchievementStats));
router.get('/:achievementId', authenticateToken, asyncHandler(achievementController.getAchievementById));
router.delete('/:achievementId', authenticateToken, asyncHandler(achievementController.deleteAchievement));

// Public routes
router.get('/leaderboard', asyncHandler(achievementController.getLeaderboard));
router.get('/global/stats', asyncHandler(achievementController.getGlobalAchievementStats));

// Admin routes
router.get('/admin/all', authenticateToken, requireRole('admin'), asyncHandler(achievementController.getAllAchievements));

export { router as achievementRoutes };
