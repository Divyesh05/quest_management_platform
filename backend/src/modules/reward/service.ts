import { PrismaClient } from '@prisma/client';
import { IRewardService, IRewardResponse, ICreateRewardData, IUpdateRewardData, IRewardFilters } from './interfaces';
import { RewardError } from './utils';

const prisma = new PrismaClient();

export class RewardService implements IRewardService {
  async createReward(data: ICreateRewardData): Promise<IRewardResponse> {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: data.userId }
    });

    if (!user) {
      throw new RewardError('User not found', 404);
    }

    // Check if quest exists (if provided)
    if (data.questId) {
      const quest = await prisma.quest.findUnique({
        where: { id: data.questId }
      });

      if (!quest) {
        throw new RewardError('Quest not found', 404);
      }
    }

    const reward = await prisma.reward.create({
      data: {
        userId: data.userId,
        questId: data.questId,
        type: data.type,
        points: data.points,
        description: data.description,
        metadata: data.metadata
      },
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

    // Update user points
    await prisma.user.update({
      where: { id: data.userId },
      data: {
        points: {
          increment: data.points
        }
      }
    });

    return reward;
  }

  async getRewardById(rewardId: string): Promise<IRewardResponse> {
    const reward = await prisma.reward.findUnique({
      where: { id: rewardId },
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

    if (!reward) {
      throw new RewardError('Reward not found', 404);
    }

    return reward;
  }

  async updateReward(rewardId: string, data: IUpdateRewardData): Promise<IRewardResponse> {
    const existingReward = await prisma.reward.findUnique({
      where: { id: rewardId }
    });

    if (!existingReward) {
      throw new RewardError('Reward not found', 404);
    }

    // If points are being updated, adjust user points
    let userPointsUpdate = {};
    if (data.points !== undefined && data.points !== existingReward.points) {
      const pointsDifference = data.points - existingReward.points;
      userPointsUpdate = {
        points: {
          increment: pointsDifference
        }
      };
    }

    const [updatedReward] = await Promise.all([
      prisma.reward.update({
        where: { id: rewardId },
        data: {
          ...data,
          updatedAt: new Date()
        },
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
      }),
      // Update user points if needed
      Object.keys(userPointsUpdate).length > 0
        ? prisma.user.update({
            where: { id: existingReward.userId },
            data: userPointsUpdate
          })
        : Promise.resolve()
    ]);

    return updatedReward;
  }

  async deleteReward(rewardId: string): Promise<void> {
    const reward = await prisma.reward.findUnique({
      where: { id: rewardId }
    });

    if (!reward) {
      throw new RewardError('Reward not found', 404);
    }

    // Deduct points from user
    await prisma.user.update({
      where: { id: reward.userId },
      data: {
        points: {
          decrement: reward.points
        }
      }
    });

    await prisma.reward.delete({
      where: { id: rewardId }
    });
  }

  async getUserRewards(userId: string, filters: IRewardFilters = {}): Promise<{
    rewards: IRewardResponse[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, type, questId } = filters;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (type) where.type = type;
    if (questId) where.questId = questId;

    const [rewards, total] = await Promise.all([
      prisma.reward.findMany({
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
          createdAt: 'desc'
        }
      }),
      prisma.reward.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      rewards,
      total,
      page,
      totalPages
    };
  }

  async getAllRewards(filters: IRewardFilters = {}): Promise<{
    rewards: IRewardResponse[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, userId, type, questId } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userId) where.userId = userId;
    if (type) where.type = type;
    if (questId) where.questId = questId;

    const [rewards, total] = await Promise.all([
      prisma.reward.findMany({
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
          createdAt: 'desc'
        }
      }),
      prisma.reward.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      rewards,
      total,
      page,
      totalPages
    };
  }

  async getRewardStats(timeRange?: 'week' | 'month' | 'year' | 'all'): Promise<{
    totalRewards: number;
    totalPointsAwarded: number;
    rewardsByType: Record<string, number>;
    rewardsByUser: {
      user: {
        id: string;
        email: string;
        points: number;
      };
      rewardCount: number;
      totalPoints: number;
    }[];
    rewardsByQuest: {
      quest: {
        id: string;
        title: string;
        category: string;
        difficulty: string;
      };
      rewardCount: number;
      totalPoints: number;
    }[];
    recentRewards: IRewardResponse[];
  }> {
    // Build date filter
    let dateFilter = {};
    if (timeRange && timeRange !== 'all') {
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

    const [
      totalRewards,
      rewards,
      rewardsByType,
      rewardsByUser,
      rewardsByQuest,
      recentRewards
    ] = await Promise.all([
      prisma.reward.count({
        where: dateFilter ? { createdAt: dateFilter } : {}
      }),
      prisma.reward.findMany({
        where: dateFilter ? { createdAt: dateFilter } : {},
        include: {
          user: { select: { points: true } },
          quest: { select: { reward: true } }
        }
      }),
      prisma.reward.groupBy({
        by: ['type'],
        where: dateFilter ? { createdAt: dateFilter } : {},
        _count: { type: true }
      }),
      this.getRewardsByUser(dateFilter),
      this.getRewardsByQuest(dateFilter),
      prisma.reward.findMany({
        where: dateFilter ? { createdAt: dateFilter } : {},
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
          createdAt: 'desc'
        },
        take: 10
      })
    ]);

    const totalPointsAwarded = rewards.reduce((sum, reward) => sum + reward.points, 0);
    const typeStats = rewardsByType.reduce((acc: Record<string, number>, item) => {
      acc[item.type] = item._count.type;
      return acc;
    }, {});

    return {
      totalRewards,
      totalPointsAwarded,
      rewardsByType: typeStats,
      rewardsByUser,
      rewardsByQuest,
      recentRewards
    };
  }

  async awardQuestReward(userId: string, questId: string, bonusPoints: number = 0): Promise<IRewardResponse> {
    // Check if user already has a reward for this quest
    const existingReward = await prisma.reward.findFirst({
      where: {
        userId,
        questId,
        type: 'quest_completion'
      }
    });

    if (existingReward) {
      throw new RewardError('User already received reward for this quest', 409);
    }

    // Get quest details
    const quest = await prisma.quest.findUnique({
      where: { id: questId }
    });

    if (!quest) {
      throw new RewardError('Quest not found', 404);
    }

    const totalPoints = quest.reward + bonusPoints;

    const reward = await this.createReward({
      userId,
      questId,
      type: 'quest_completion',
      points: totalPoints,
      description: `Completed quest: ${quest.title}${bonusPoints > 0 ? ` (with ${bonusPoints} bonus points)` : ''}`,
      metadata: {
        questTitle: quest.title,
        questDifficulty: quest.difficulty,
        questCategory: quest.category,
        baseReward: quest.reward,
        bonusPoints
      }
    });

    return reward;
  }

  async awardBonusReward(userId: string, points: number, description: string, metadata?: any): Promise<IRewardResponse> {
    return this.createReward({
      userId,
      type: 'bonus',
      points,
      description,
      metadata
    });
  }

  async awardStreakReward(userId: string, streakCount: number, points: number): Promise<IRewardResponse> {
    return this.createReward({
      userId,
      type: 'streak',
      points,
      description: `${streakCount}-day streak bonus`,
      metadata: {
        streakCount,
        streakType: 'daily'
      }
    });
  }

  // Helper methods
  private async getRewardsByUser(dateFilter: any): Promise<any[]> {
    const where = dateFilter ? { createdAt: dateFilter } : {};
    
    const userStats = await prisma.reward.groupBy({
      by: ['userId'],
      where,
      _count: { userId: true },
      _sum: { points: true }
    });

    const users = await Promise.all(
      userStats.map(async (stat) => {
        const user = await prisma.user.findUnique({
          where: { id: stat.userId },
          select: { id: true, email: true, points: true }
        });

        return user ? {
          user,
          rewardCount: stat._count.userId,
          totalPoints: stat._sum.points || 0
        } : null;
      })
    );

    return users
      .filter((user): user is NonNullable<typeof user> => user !== null)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 10);
  }

  private async getRewardsByQuest(dateFilter: any): Promise<any[]> {
    const where = dateFilter ? { createdAt: dateFilter } : {};
    
    const questStats = await prisma.reward.groupBy({
      by: ['questId'],
      where,
      _count: { questId: true },
      _sum: { points: true }
    });

    const quests = await Promise.all(
      questStats.map(async (stat) => {
        if (!stat.questId) return null;
        
        const quest = await prisma.quest.findUnique({
          where: { id: stat.questId },
          select: {
            id: true,
            title: true,
            category: true,
            difficulty: true
          }
        });

        return quest ? {
          quest,
          rewardCount: stat._count.questId,
          totalPoints: stat._sum.points || 0
        } : null;
      })
    );

    return quests
      .filter((quest): quest is NonNullable<typeof quest> => quest !== null)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 10);
  }

  async getUserPoints(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { points: true }
    });

    if (!user) {
      throw new RewardError('User not found', 404);
    }

    return user.points;
  }

  async getRewardHistory(userId: string): Promise<IRewardResponse[]> {
    const rewards = await prisma.reward.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
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
            title: true
          }
        }
      }
    });

    return rewards.map(reward => ({
      id: reward.id,
      userId: reward.userId,
      questId: reward.questId,
      type: reward.type,
      points: reward.points,
      description: reward.description,
      metadata: reward.metadata as Record<string, any> | undefined,
      createdAt: reward.createdAt,
      user: reward.user,
      quest: reward.quest
    }));
  }
}
