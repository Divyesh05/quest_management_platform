import { Router } from 'express';
import { AchievementController } from './controller';
import { authenticateToken, authorize } from '../auth/middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';

const router = Router();
const achievementController = new AchievementController();

// Public routes
router.get('/leaderboard', asyncHandler(achievementController.getAchievementLeaderboard));

// Protected routes
router.get('/my', authenticateToken, asyncHandler(achievementController.getMyAchievements));
router.get('/:id', authenticateToken, asyncHandler(achievementController.getAchievementById));

// Admin routes
router.post('/', authenticateToken, authorize('admin'), asyncHandler(achievementController.createAchievement));
router.get('/', authenticateToken, authorize('admin'), asyncHandler(achievementController.getAllAchievements));
router.put('/:id', authenticateToken, authorize('admin'), asyncHandler(achievementController.updateAchievement));
router.delete('/:id', authenticateToken, authorize('admin'), asyncHandler(achievementController.deleteAchievement));

export default router;
