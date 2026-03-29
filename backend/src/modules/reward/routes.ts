import { Router } from 'express';
import { RewardController } from './controller';
import { authenticateToken, authorize } from '../auth/middleware/auth';
import { validateReward } from './middleware/validation';
import { asyncHandler } from '../../middleware/errorHandler';

const router = Router();

// Protected routes
router.get('/my', authenticateToken, asyncHandler(RewardController.getMyRewards));
router.get('/my/points', authenticateToken, asyncHandler(RewardController.getMyPoints));
router.get('/my/history', authenticateToken, asyncHandler(RewardController.getRewardHistory));

// Admin routes
router.post('/', authenticateToken, authorize('admin'), validateReward, asyncHandler(RewardController.createReward));
router.get('/', authenticateToken, authorize('admin'), asyncHandler(RewardController.getAllRewards));
router.put('/:id', authenticateToken, authorize('admin'), asyncHandler(RewardController.updateReward));
router.delete('/:id', authenticateToken, authorize('admin'), asyncHandler(RewardController.deleteReward));
router.post('/grant', authenticateToken, authorize('admin'), asyncHandler(RewardController.grantReward));
router.post('/points/:userId', authenticateToken, authorize('admin'), asyncHandler(RewardController.awardPoints));

export default router;
