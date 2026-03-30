import { Router } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../../types';
import { prisma } from '../database/service';
import { authenticateToken, optionalAuth } from '../../middleware/auth';
import { asyncHandler, validateRequest } from '../../middleware/errorHandler';
import { paginationSchema } from '../../validation/schemas';

const router = Router();

// Get leaderboard (public)
router.get('/',
  validateRequest(paginationSchema, 'query'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { page, limit, sortBy, sortOrder } = req.query as any;
    
    const skip = (page - 1) * limit;

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        points: true,
        createdAt: true,
        _count: {
          select: {
            achievements: true,
            rewards: true,
          },
        },
        rewards: {
          select: {
            points: true,
          },
        },
      },
      orderBy: {
        [sortBy || 'points']: sortOrder,
      },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const totalUsers = await prisma.user.count();

    // Calculate leaderboard data
    const leaderboard = users.map((user, index) => {
      const totalReward = user.rewards.reduce((sum, reward) => sum + reward.points, 0);
      const averageReward = user._count.rewards > 0 ? totalReward / user._count.rewards : 0;
      const globalRank = skip + index + 1;

      return {
        rank: globalRank,
        user: {
          id: user.id,
          email: user.email,
          name: user.email.split('@')[0], // Use email prefix as name for now
        },
        points: user.points,
        achievementCount: user._count.achievements,
        totalReward,
        averageReward: Math.round(averageReward),
        rankChange: Math.random() > 0.5 ? 1 : Math.random() > 0.5 ? -1 : 0, // Mock rank change
        badges: getBadgesForUser(user.points, user._count.achievements),
      };
    });

    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      success: true,
      message: 'Leaderboard retrieved successfully',
      data: leaderboard,
      pagination: {
        page,
        limit,
        total: totalUsers,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    });
  })
);

// Get top N users (public)
router.get('/top/:limit',
  asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const limit = Math.min(parseInt(req.params.limit), 50); // Cap at 50

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        points: true,
        _count: {
          select: {
            achievements: true,
            rewards: true,
          },
        },
        rewards: {
          select: {
            points: true,
          },
        },
      },
      orderBy: {
        points: 'desc',
      },
      take: limit,
    });

    const leaderboard = users.map((user, index) => {
      const totalReward = user.rewards.reduce((sum, reward) => sum + reward.points, 0);
      const averageReward = user._count.rewards > 0 ? totalReward / user._count.rewards : 0;

      return {
        rank: index + 1,
        user: {
          id: user.id,
          email: user.email,
          name: user.email.split('@')[0],
        },
        points: user.points,
        achievementCount: user._count.achievements,
        totalReward,
        averageReward: Math.round(averageReward),
        rankChange: 0, // Top users don't have rank change
        badges: getBadgesForUser(user.points, user._count.achievements),
      };
    });

    res.json({
      success: true,
      message: 'Top users retrieved successfully',
      data: leaderboard
    });
  })
);

// Get current user's rank (authenticated)
router.get('/my-rank',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        points: true,
        _count: {
          select: {
            achievements: true,
            rewards: true,
          },
        },
        rewards: {
          select: {
            points: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    // Get user's rank
    const usersWithHigherPoints = await prisma.user.count({
      where: {
        points: {
          gt: user.points,
        },
      },
    });

    const rank = usersWithHigherPoints + 1;

    const totalReward = user.rewards.reduce((sum, reward) => sum + reward.points, 0);
    const averageReward = user._count.rewards > 0 ? totalReward / user._count.rewards : 0;

    const rankData = {
      rank,
      user: {
        id: user.id,
        email: user.email,
        name: user.email.split('@')[0],
      },
      points: user.points,
      achievementCount: user._count.achievements,
      totalReward,
      averageReward: Math.round(averageReward),
      badges: getBadgesForUser(user.points, user._count.achievements),
    };

    res.json({
      success: true,
      message: 'My rank retrieved successfully',
      data: rankData
    });
  })
);

// Helper function to determine badges based on points and achievements
function getBadgesForUser(points: number, achievementCount: number): string[] {
  const badges: string[] = [];

  if (points >= 1000) badges.push('👑'); // Crown for top performers
  if (points >= 500) badges.push('🏆'); // Trophy for high achievers
  if (achievementCount >= 10) badges.push('⭐'); // Star for highly active users
  if (achievementCount >= 5) badges.push('🎯'); // Target for consistent users
  if (points >= 100) badges.push('💎'); // Diamond for dedicated users
  if (points >= 50) badges.push('🥉'); // Bronze for active users
  if (achievementCount >= 1) badges.push('🌟'); // First achievement

  return badges.length > 0 ? badges : ['🌱']; // Seedling for new users
}

export default router;
