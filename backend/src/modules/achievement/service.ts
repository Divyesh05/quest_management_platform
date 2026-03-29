import { PrismaClient } from '@prisma/client';
import { IAchievementService, IAchievementResponse, IAchievementFilters } from './interfaces';
import { AchievementError } from './utils';

const prisma = new PrismaClient();

export class AchievementService implements IAchievementService {
  async getUserAchievements(userId: string, filters: IAchievementFilters = {}): Promise<{
    achievements: IAchievementResponse[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, category, difficulty } = filters;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    
    if (category || difficulty) {
      where.quest = {};
      if (category) where.quest.category = category;
      if (difficulty) where.quest.difficulty = difficulty;
    }

    const [achievements, total] = await Promise.all([
      prisma.achievement.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              points: true
            }
          },
          quest: {
            select: {
              id: true,
              title: true,
              description: true,
              reward: true,
              difficulty: true,
              category: true
            }
          }
        },
        orderBy: {
          earnedAt: 'desc'
        }
      }),
      prisma.achievement.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      achievements,
      total,
      page,
      totalPages
    };
  }

  async getAchievementById(achievementId: string): Promise<IAchievementResponse> {
    const achievement = await prisma.achievement.findUnique({
      where: { id: achievementId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            points: true
          }
        },
        quest: {
          select: {
            id: true,
            title: true,
            description: true,
            reward: true,
            difficulty: true,
            category: true
          }
        }
      }
    });

    if (!achievement) {
      throw new AchievementError('Achievement not found', 404);
    }

    return achievement;
  }

  async getAllAchievements(filters: IAchievementFilters = {}): Promise<{
    achievements: IAchievementResponse[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, userId, category, difficulty } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (userId) where.userId = userId;
    
    if (category || difficulty) {
      where.quest = {};
      if (category) where.quest.category = category;
      if (difficulty) where.quest.difficulty = difficulty;
    }

    const [achievements, total] = await Promise.all([
      prisma.achievement.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              points: true
            }
          },
          quest: {
            select: {
              id: true,
              title: true,
              description: true,
              reward: true,
              difficulty: true,
              category: true
            }
          }
        },
        orderBy: {
          earnedAt: 'desc'
        }
      }),
      prisma.achievement.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      achievements,
      total,
      page,
      totalPages
    };
  }

  async getLeaderboard(filters: {
    page?: number;
    limit?: number;
    category?: string;
    difficulty?: string;
    timeRange?: 'all' | 'week' | 'month' | 'year';
  } = {}): Promise<{
    leaderboard: {
      user: {
        id: string;
        email: string;
        points: number;
      };
      achievementCount: number;
      totalReward: number;
    }[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, category, difficulty, timeRange = 'all' } = filters;
    const skip = (page - 1) * limit;

    // Build date filter for time range
    let dateFilter = {};
    if (timeRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (timeRange) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }
      
      dateFilter = { gte: startDate };
    }

    // Build where clause
    const where: any = {};
    if (dateFilter && Object.keys(dateFilter).length > 0) {
      where.earnedAt = dateFilter;
    }
    
    if (category || difficulty) {
      where.quest = {};
      if (category) where.quest.category = category;
      if (difficulty) where.quest.difficulty = difficulty;
    }

    // Get user achievement stats
    const userStats = await prisma.achievement.groupBy({
      by: ['userId'],
      where,
      _count: {
        userId: true
      },
      _sum: {
        // We need to join with quest to get reward
      }
    });

    // Get detailed achievement data for each user
    const leaderboardPromises = userStats.map(async (stat) => {
      const user = await prisma.user.findUnique({
        where: { id: stat.userId },
        select: {
          id: true,
          email: true,
          points: true
        }
      });

      if (!user) return null;

      const userAchievements = await prisma.achievement.findMany({
        where: {
          userId: stat.userId,
          ...where
        },
        include: {
          quest: {
            select: {
              reward: true
            }
          }
        }
      });

      const totalReward = userAchievements.reduce((sum, ach) => sum + ach.quest.reward, 0);

      return {
        user,
        achievementCount: stat._count.userId,
        totalReward
      };
    });

    const leaderboardResults = (await Promise.all(leaderboardPromises))
      .filter((result): result is NonNullable<typeof result> => result !== null)
      .sort((a, b) => b.totalReward - a.totalReward);

    const total = leaderboardResults.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedResults = leaderboardResults.slice(skip, skip + limit);

    return {
      leaderboard: paginatedResults,
      total,
      page,
      totalPages
    };
  }

  async getUserAchievementStats(userId: string): Promise<{
    totalAchievements: number;
    totalReward: number;
    byCategory: Record<string, number>;
    byDifficulty: Record<string, number>;
    recentAchievements: IAchievementResponse[];
  }> {
    const [
      totalAchievements,
      achievements,
      byCategory,
      byDifficulty
    ] = await Promise.all([
      prisma.achievement.count({ where: { userId } }),
      prisma.achievement.findMany({
        where: { userId },
        include: {
          quest: {
            select: {
              id: true,
              title: true,
              description: true,
              reward: true,
              difficulty: true,
              category: true
            }
          },
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              points: true
            }
          }
        },
        orderBy: {
          earnedAt: 'desc'
        },
        take: 5
      }),
      prisma.achievement.groupBy({
        by: ['quest'],
        where: { userId },
        _count: { quest: true }
      }),
      prisma.achievement.groupBy({
        by: ['quest'],
        where: { userId },
        _count: { quest: true }
      })
    ]);

    // Calculate total reward
    const totalReward = achievements.reduce((sum, ach) => sum + ach.quest.reward, 0);

    // Process category stats
    const categoryStats = achievements.reduce((acc: Record<string, number>, ach) => {
      acc[ach.quest.category] = (acc[ach.quest.category] || 0) + 1;
      return acc;
    }, {});

    // Process difficulty stats
    const difficultyStats = achievements.reduce((acc: Record<string, number>, ach) => {
      acc[ach.quest.difficulty] = (acc[ach.quest.difficulty] || 0) + 1;
      return acc;
    }, {});

    return {
      totalAchievements,
      totalReward,
      byCategory: categoryStats,
      byDifficulty: difficultyStats,
      recentAchievements: achievements
    };
  }

  async getGlobalAchievementStats(): Promise<{
    totalAchievements: number;
    totalUsers: number;
    averageAchievementsPerUser: number;
    totalRewardDistributed: number;
    byCategory: Record<string, number>;
    byDifficulty: Record<string, { count: number; totalReward: number }>;
    topQuests: {
      quest: {
        id: string;
        title: string;
        reward: number;
        category: string;
        difficulty: string;
      };
      achievementCount: number;
      totalReward: number;
      completionRate: number;
    }[];
  }> {
    const [
      totalAchievements,
      totalUsers,
      achievementsByQuest,
      allAchievements,
      allQuests
    ] = await Promise.all([
      prisma.achievement.count(),
      prisma.user.count(),
      prisma.achievement.groupBy({
        by: ['questId'],
        _count: { questId: true }
      }),
      prisma.achievement.findMany({
        include: {
          quest: {
            select: {
              id: true,
              title: true,
              reward: true,
              category: true,
              difficulty: true
            }
          }
        }
      }),
      prisma.quest.findMany({
        where: { isActive: true },
        select: {
          id: true,
          title: true,
          reward: true,
          category: true,
          difficulty: true
        }
      })
    ]);

    const averageAchievementsPerUser = totalUsers > 0 ? totalAchievements / totalUsers : 0;
    const totalRewardDistributed = allAchievements.reduce((sum, ach) => sum + ach.quest.reward, 0);

    // Category stats
    const categoryStats = allAchievements.reduce((acc: Record<string, number>, ach) => {
      acc[ach.quest.category] = (acc[ach.quest.category] || 0) + 1;
      return acc;
    }, {});

    // Difficulty stats with rewards
    const difficultyStats = allAchievements.reduce((acc: Record<string, { count: number; totalReward: number }>, ach) => {
      if (!acc[ach.quest.difficulty]) {
        acc[ach.quest.difficulty] = { count: 0, totalReward: 0 };
      }
      acc[ach.quest.difficulty].count += 1;
      acc[ach.quest.difficulty].totalReward += ach.quest.reward;
      return acc;
    }, {});

    // Top quests
    const questStats = achievementsByQuest.map(stat => {
      const quest = allQuests.find(q => q.id === stat.questId);
      if (!quest) return null;

      const totalReward = stat._count.questId * quest.reward;
      const completionRate = allQuests.length > 0 ? (stat._count.questId / totalUsers) * 100 : 0;

      return {
        quest,
        achievementCount: stat._count.questId,
        totalReward,
        completionRate
      };
    }).filter((stat): stat is NonNullable<typeof stat> => stat !== null)
      .sort((a, b) => b.achievementCount - a.achievementCount)
      .slice(0, 10);

    return {
      totalAchievements,
      totalUsers,
      averageAchievementsPerUser,
      totalRewardDistributed,
      byCategory: categoryStats,
      byDifficulty: difficultyStats,
      topQuests: questStats
    };
  }

  async deleteAchievement(achievementId: string, requestingUserId?: string): Promise<void> {
    const achievement = await prisma.achievement.findUnique({
      where: { id: achievementId },
      include: {
        quest: {
          select: { reward: true }
        }
      }
    });

    if (!achievement) {
      throw new AchievementError('Achievement not found', 404);
    }

    // Check permissions
    if (requestingUserId && achievement.userId !== requestingUserId) {
      throw new AchievementError('You can only delete your own achievements', 403);
    }

    // Remove points from user
    await prisma.user.update({
      where: { id: achievement.userId },
      data: {
        points: {
          decrement: achievement.quest.reward
        }
      }
    });

    // Delete achievement
    await prisma.achievement.delete({
      where: { id: achievementId }
    });
  }

  async createAchievement(userId: string, questId: string): Promise<IAchievementResponse> {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, points: true }
    });

    if (!user) {
      throw new AchievementError('User not found', 404);
    }

    // Check if quest exists
    const quest = await prisma.quest.findUnique({
      where: { id: questId },
      select: { id: true, title: true, description: true, reward: true, difficulty: true, category: true }
    });

    if (!quest) {
      throw new AchievementError('Quest not found', 404);
    }

    // Check if achievement already exists
    const existingAchievement = await prisma.achievement.findUnique({
      where: { userId_questId: { userId, questId } }
    });

    if (existingAchievement) {
      throw new AchievementError('Achievement already exists for this user and quest', 409);
    }

    // Create achievement
    const achievement = await prisma.achievement.create({
      data: {
        userId,
        questId
      },
      include: {
        user: {
          select: { id: true, email: true, role: true, points: true }
        },
        quest: {
          select: { id: true, title: true, description: true, reward: true, difficulty: true, category: true }
        }
      }
    });

    // Add points to user
    await prisma.user.update({
      where: { id: userId },
      data: { points: { increment: quest.reward } }
    });

    return achievement;
  }

  async updateAchievement(achievementId: string, data: { earnedAt?: Date }): Promise<IAchievementResponse> {
    const achievement = await prisma.achievement.update({
      where: { id: achievementId },
      data,
      include: {
        user: {
          select: { id: true, email: true, role: true, points: true }
        },
        quest: {
          select: { id: true, title: true, description: true, reward: true, difficulty: true, category: true }
        }
      }
    });

    return achievement;
  }
}
