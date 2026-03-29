import { Router } from 'express';
import { RewardController } from './controller';
import { authenticateToken, requireRole } from '../auth/middleware';
import { asyncHandler } from './utils';

const router = Router();
const rewardController = new RewardController();

// User routes (authenticated users)
router.get('/my', authenticateToken, asyncHandler(rewardController.getUserRewards));
router.get('/:rewardId', authenticateToken, asyncHandler(rewardController.getRewardById));

// Admin routes
router.post('/', authenticateToken, requireRole('admin'), asyncHandler(rewardController.createReward));
router.put('/:rewardId', authenticateToken, requireRole('admin'), asyncHandler(rewardController.updateReward));
router.delete('/:rewardId', authenticateToken, requireRole('admin'), asyncHandler(rewardController.deleteReward));
router.get('/admin/all', authenticateToken, requireRole('admin'), asyncHandler(rewardController.getAllRewards));
router.get('/admin/stats', authenticateToken, requireRole('admin'), asyncHandler(rewardController.getRewardStats));

// Special reward routes (admin only)
router.post('/award/quest/:userId/:questId', authenticateToken, requireRole('admin'), asyncHandler(rewardController.awardQuestReward));
router.post('/award/bonus/:userId', authenticateToken, requireRole('admin'), asyncHandler(rewardController.awardBonusReward));
router.post('/award/streak/:userId', authenticateToken, requireRole('admin'), asyncHandler(rewardController.awardStreakReward));

export { router as rewardRoutes };
