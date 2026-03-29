import { Router } from 'express';
import { LeaderboardController } from './controller';
import { authenticateToken } from '../auth/middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';

const router = Router();

// Public routes
router.get('/', asyncHandler(LeaderboardController.getLeaderboard));
router.get('/top/:limit', asyncHandler(LeaderboardController.getTopUsers));
router.get('/rank/:userId', asyncHandler(LeaderboardController.getUserRank));
router.get('/badges/:userId', asyncHandler(LeaderboardController.getUserBadges));

// Protected routes
router.get('/my-rank', authenticateToken, asyncHandler(LeaderboardController.getMyRank));
router.get('/my-badges', authenticateToken, asyncHandler(LeaderboardController.getMyBadges));

export default router;
