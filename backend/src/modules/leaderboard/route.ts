import { Router } from 'express';
import { LeaderboardController } from './controller';
import { authenticateToken } from '../auth/middleware';
import { asyncHandler } from './utils';

const router = Router();
const leaderboardController = new LeaderboardController();

// Public routes
router.get('/global', asyncHandler(leaderboardController.getGlobalLeaderboard));
router.get('/quest/:questId', asyncHandler(leaderboardController.getQuestLeaderboard));
router.get('/categories', asyncHandler(leaderboardController.getCategoryLeaderboards));
router.get('/stats', asyncHandler(leaderboardController.getLeaderboardStats));

// User routes (authenticated)
router.get('/user', authenticateToken, asyncHandler(leaderboardController.getUserLeaderboard));
router.get('/user/ranking', authenticateToken, asyncHandler(leaderboardController.getUserRanking));

export { router as leaderboardRoutes };
