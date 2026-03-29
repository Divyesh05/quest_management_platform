import { PrismaClient } from '@prisma/client';
import { ILeaderboardService, ILeaderboardEntry, ILeaderboardFilters, ILeaderboardStats } from './interfaces';
import { LeaderboardError } from './utils';

const prisma = new PrismaClient();

export class LeaderboardService implements ILeaderboardService {
  async getGlobalLeaderboard(filters: ILeaderboardFilters = {}): Promise<{
    leaderboard: ILeaderboardEntry[];
    total: number;
    page: number;
    totalPages: number;
    userRank?: {
      rank: number;
      entry: ILeaderboardEntry;
    };
  }> {
    const { page = 1, limit = 50, timeRange = 'all', category, difficulty } = filters;
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

    // Get user achievement stats with filters
    const userStats = await this.getUserLeaderboardStats(dateFilter, category, difficulty);

    // Apply pagination
    const total = userStats.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedResults = userStats.slice(skip, skip + limit);

    // Add rank information
    const leaderboard = paginatedResults.map((entry, index) => ({
      ...entry,
      rank: skip + index + 1,
      rankChange: await this.calculateRankChange(entry.user.id, dateFilter),
      badges: await this.getUserBadges(entry.user.id)
    }));

    return {
      leaderboard,
      total,
      page,
      totalPages
    };
  }

  async getUserLeaderboard(userId: string, filters: ILeaderboardFilters = {}): Promise<{
    leaderboard: ILeaderboardEntry[];
    userRank: {
      rank: number;
      entry: ILeaderboardEntry;
    };
    nearbyUsers: ILeaderboardEntry[];
  }> {
    const { limit = 10, timeRange = 'all', category, difficulty } = filters;

    // Get global leaderboard
    const globalResult = await this.getGlobalLeaderboard({ page: 1, limit: 1000, timeRange, category, difficulty });
    
    // Find user's rank
    const userEntry = globalResult.leaderboard.find(entry => entry.user.id === userId);
    
    if (!userEntry) {
      throw new LeaderboardError('User not found in leaderboard', 404);
    }

    const userRank = {
      rank: userEntry.rank,
      entry: userEntry
    };

    // Get nearby users (5 above, 5 below)
    const userIndex = globalResult.leaderboard.findIndex(entry => entry.user.id === userId);
    const startIndex = Math.max(0, userIndex - 5);
    const endIndex = Math.min(globalResult.leaderboard.length, userIndex + 6);
    const nearbyUsers = globalResult.leaderboard.slice(startIndex, endIndex);

    return {
      leaderboard: nearbyUsers,
      userRank,
      nearbyUsers
    };
  }

  async getQuestLeaderboard(questId: string, filters: ILeaderboardFilters = {}): Promise<{
    leaderboard: {
      user: {
        id: string;
        email: string;
        points: number;
      };
      submission: {
        id: string;
        submittedAt: Date;
        status: string;
        feedback?: string;
      };
      rank: number;
      timeToComplete?: number;
    }[];
    quest: {
      id: string;
      title: string;
      description: string;
      difficulty: string;
      category: string;
      reward: number;
    };
    stats: {
      totalSubmissions: number;
      approvedSubmissions: number;
      averageTimeToComplete: number;
      completionRate: number;
    };
  }> {
    const { page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;

    // Get quest details
    const quest = await prisma.quest.findUnique({
      where: { id: questId }
    });

    if (!quest) {
      throw new LeaderboardError('Quest not found', 404);
    }

    // Get approved submissions for this quest
    const submissions = await prisma.submission.findMany({
      where: { 
        questId,
        status: 'approved'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            points: true
          }
        }
      },
      orderBy: { submittedAt: 'asc' }
    });

    // Calculate leaderboard entries
    const leaderboard = submissions.map((submission, index) => ({
      user: submission.user,
      submission: {
        id: submission.id,
        submittedAt: submission.submittedAt,
        status: submission.status,
        feedback: submission.feedback
      },
      rank: index + 1,
      timeToComplete: this.calculateTimeToComplete(submission)
    }));

    // Get quest statistics
    const [totalSubmissions, approvedSubmissions] = await Promise.all([
      prisma.submission.count({ where: { questId } }),
      prisma.submission.count({ where: { questId, status: 'approved' } })
    ]);

    const averageTimeToComplete = this.calculateAverageTimeToComplete(submissions);
    const completionRate = submissions.length > 0 ? (approvedSubmissions / totalSubmissions) * 100 : 0;

    return {
      leaderboard: leaderboard.slice(skip, skip + limit),
      quest: {
        id: quest.id,
        title: quest.title,
        description: quest.description,
        difficulty: quest.difficulty,
        category: quest.category,
        reward: quest.reward
      },
      stats: {
        totalSubmissions,
        approvedSubmissions,
        averageTimeToComplete,
        completionRate
      }
    };
  }

  async getCategoryLeaderboards(timeRange: 'week' | 'month' | 'year' | 'all' = 'all'): Promise<{
    categories: {
      category: string;
      leaderboard: ILeaderboardEntry[];
      totalParticipants: number;
    }[];
  }> {
    // Get all unique categories
    const quests = await prisma.quest.findMany({
      select: { category: true, difficulty: true },
      distinct: ['category']
    });

    const categories = [...new Set(quests.map(q => q.category))];

    const categoryLeaderboards = await Promise.all(
      categories.map(async (category) => {
        const leaderboard = await this.getGlobalLeaderboard({
          page: 1,
          limit: 10,
          timeRange,
          category
        });

        return {
          category,
          leaderboard: leaderboard.leaderboard,
          totalParticipants: leaderboard.total
        };
      })
    );

    return {
      categories: categoryLeaderboards
    };
  }

  async getLeaderboardStats(timeRange: 'week' | 'month' | 'year' | 'all' = 'all'): Promise<ILeaderboardStats> {
    // Build date filter
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

    const [
      totalUsers,
      activeUsers,
      totalAchievements,
      totalPointsAwarded,
      topPerformers,
      categoryStats,
      difficultyStats,
      recentActivity
    ] = await Promise.all([
      prisma.user.count(),
      this.getActiveUsersCount(dateFilter),
      this.getAchievementsCount(dateFilter),
      this.getTotalPointsAwarded(dateFilter),
      this.getTopPerformers(5, dateFilter),
      this.getCategoryStats(dateFilter),
      this.getDifficultyStats(dateFilter),
      this.getRecentLeaderboardActivity(10, dateFilter)
    ]);

    return {
      totalUsers,
      activeUsers,
      totalAchievements,
      totalPointsAwarded,
      topPerformers,
      categoryStats,
      difficultyStats,
      recentActivity,
      timeRange
    };
  }

  async getUserRanking(userId: string, timeRange: 'week' | 'month' | 'year' | 'all' = 'all'): Promise<{
    globalRank: number;
    categoryRanks: Record<string, number>;
    difficultyRanks: Record<string, number>;
    totalParticipants: number;
    badges: string[];
  }> {
    const globalLeaderboard = await this.getGlobalLeaderboard({ timeRange, limit: 10000 });
    const userEntry = globalLeaderboard.leaderboard.find(entry => entry.user.id === userId);

    if (!userEntry) {
      throw new LeaderboardError('User not found in leaderboard', 404);
    }

    const categories = ['education', 'general', 'technical', 'creative'];
    const difficulties = ['easy', 'medium', 'hard'];

    const [categoryRanks, difficultyRanks] = await Promise.all([
      Promise.all(
        categories.map(async (category) => {
          const categoryLeaderboard = await this.getGlobalLeaderboard({ timeRange, category, limit: 10000 });
          const categoryEntry = categoryLeaderboard.leaderboard.find(entry => entry.user.id === userId);
          return { category, rank: categoryEntry?.rank || null };
        })
      ),
      Promise.all(
        difficulties.map(async (difficulty) => {
          const difficultyLeaderboard = await this.getGlobalLeaderboard({ timeRange, difficulty, limit: 10000 });
          const difficultyEntry = difficultyLeaderboard.leaderboard.find(entry => entry.user.id === userId);
          return { difficulty, rank: difficultyEntry?.rank || null };
        })
      )
    ]);

    const categoryRankMap = categoryRanks.reduce((acc, { category, rank }) => {
      if (rank) acc[category] = rank;
      return acc;
    }, {} as Record<string, number>);

    const difficultyRankMap = difficultyRanks.reduce((acc, { difficulty, rank }) => {
      if (rank) acc[difficulty] = rank;
      return acc;
    }, {} as Record<string, number>);

    const badges = await this.getUserBadges(userId);

    return {
      globalRank: userEntry.rank,
      categoryRanks: categoryRankMap,
      difficultyRanks: difficultyRankMap,
      totalParticipants: globalLeaderboard.total,
      badges
    };
  }

  // Helper methods
  private async getUserLeaderboardStats(dateFilter: any, category?: string, difficulty?: string): Promise<any[]> {
    let achievementWhere = dateFilter ? { earnedAt: dateFilter } : {};
    
    const userStats = await prisma.achievement.groupBy({
      by: ['userId'],
      where: achievementWhere,
      _count: { userId: true }
    });

    const users = await Promise.all(
      userStats.map(async (stat) => {
        const user = await prisma.user.findUnique({
          where: { id: stat.userId },
          select: {
            id: true,
            email: true,
            points: true,
            createdAt: true
          }
        });

        if (!user) return null;

        // Get user's achievements with quest details for filtering
        const userAchievements = await prisma.achievement.findMany({
          where: {
            userId: stat.userId,
            ...achievementWhere
          },
          include: {
            quest: {
              select: {
                category: true,
                difficulty: true,
                reward: true
              }
            }
          }
        });

        // Apply category and difficulty filters
        let filteredAchievements = userAchievements;
        if (category) {
          filteredAchievements = filteredAchievements.filter(a => a.quest.category === category);
        }
        if (difficulty) {
          filteredAchievements = filteredAchievements.filter(a => a.quest.difficulty === difficulty);
        }

        const totalReward = filteredAchievements.reduce((sum, ach) => sum + ach.quest.reward, 0);
        const questCount = filteredAchievements.length;

        return {
          user,
          achievementCount: questCount,
          totalReward,
          averageReward: questCount > 0 ? Math.round(totalReward / questCount) : 0,
          rankChange: 0, // Will be calculated separately
          badges: [] // Will be calculated separately
        };
      })
    );

    return users
      .filter((user): user is NonNullable<typeof user> => user !== null)
      .sort((a, b) => b.totalReward - a.totalReward);
  }

  private async calculateRankChange(userId: string, dateFilter: any): Promise<number> {
    // Calculate rank change compared to previous period
    const previousPeriodFilter = this.getPreviousPeriodFilter(dateFilter);
    
    if (!previousPeriodFilter) return 0;

    const currentRanking = await this.getUserLeaderboardStats(dateFilter);
    const previousRanking = await this.getUserLeaderboardStats(previousPeriodFilter);

    const currentRank = currentRanking.findIndex(u => u.user.id === userId) + 1;
    const previousRank = previousRanking.findIndex(u => u.user.id === userId) + 1;

    return previousRank - currentRank; // Positive means moved up
  }

  private getPreviousPeriodFilter(currentFilter: any): any {
    if (!currentFilter || !currentFilter.gte) return null;

    const currentDate = new Date(currentFilter.gte);
    const timeRange = this.getTimeRangeFromDate(currentDate);
    
    let previousStart: Date;
    switch (timeRange) {
      case 'week':
        previousStart = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        previousStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        break;
      case 'year':
        previousStart = new Date(currentDate.getFullYear() - 1, 0, 1);
        break;
      default:
        return null;
    }

    const previousEnd = currentDate;

    return {
      gte: previousStart,
      lt: previousEnd
    };
  }

  private getTimeRangeFromDate(date: Date): 'week' | 'month' | 'year' | 'all' {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    if (date >= weekAgo) return 'week';
    if (date >= monthStart) return 'month';
    if (date >= yearStart) return 'year';
    return 'all';
  }

  private async getUserBadges(userId: string): Promise<string[]> {
    const badges: string[] = [];
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { points: true }
    });

    if (!user) return badges;

    // Achievement-based badges
    const achievementCount = await prisma.achievement.count({
      where: { userId }
    });

    if (achievementCount >= 100) badges.push('Century Club');
    if (achievementCount >= 50) badges.push('High Achiever');
    if (achievementCount >= 25) badges.push('Rising Star');
    if (achievementCount >= 10) badges.push('Dedicated');
    if (achievementCount >= 5) badges.push('Getting Started');

    // Point-based badges
    if (user.points >= 5000) badges.push('Elite');
    if (user.points >= 2500) badges.push('Master');
    if (user.points >= 1000) badges.push('Expert');
    if (user.points >= 500) badges.push('Skilled');
    if (user.points >= 100) badges.push('Novice');

    // Streak badges (would need streak tracking implementation)
    // badges.push('On Fire', 'Consistent', 'Week Warrior');

    return badges;
  }

  private calculateTimeToComplete(submission: any): number | undefined {
    // This is simplified - in production, you'd track actual start time
    // For now, we'll use a placeholder calculation
    return 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  }

  private calculateAverageTimeToComplete(submissions: any[]): number {
    if (submissions.length === 0) return 0;
    
    const totalTime = submissions.reduce((sum, submission) => {
      return sum + (this.calculateTimeToComplete(submission) || 0);
    }, 0);

    return Math.round(totalTime / submissions.length / (1000 * 60 * 60)); // Return in hours
  }

  private async getActiveUsersCount(dateFilter: any): Promise<number> {
    if (Object.keys(dateFilter).length === 0) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return prisma.user.count({
        where: {
          OR: [
            { submissions: { some: { submittedAt: { gte: thirtyDaysAgo } } } },
            { achievements: { some: { earnedAt: { gte: thirtyDaysAgo } } } }
          ]
        }
      });
    } else {
      return prisma.user.count({
        where: {
          OR: [
            { submissions: { some: { submittedAt: dateFilter } } },
            { achievements: { some: { earnedAt: dateFilter } } }
          ]
        }
      });
    }
  }

  private async getAchievementsCount(dateFilter: any): Promise<number> {
    const where = dateFilter ? { earnedAt: dateFilter } : {};
    return prisma.achievement.count({ where });
  }

  private async getTotalPointsAwarded(dateFilter: any): Promise<number> {
    const where = dateFilter ? { earnedAt: dateFilter } : {};
    
    const achievements = await prisma.achievement.findMany({
      where,
      include: {
        quest: {
          select: { reward: true }
        }
      }
    });

    return achievements.reduce((sum, ach) => sum + ach.quest.reward, 0);
  }

  private async getTopPerformers(limit: number, dateFilter: any): Promise<any[]> {
    const userStats = await this.getUserLeaderboardStats(dateFilter);
    return userStats.slice(0, limit).map(entry => ({
      user: entry.user,
      rank: 0, // Will be set in calling function
      achievementCount: entry.achievementCount,
      totalReward: entry.totalReward
    }));
  }

  private async getCategoryStats(dateFilter: any): Promise<any[]> {
    const achievements = await prisma.achievement.findMany({
      where: dateFilter ? { earnedAt: dateFilter } : {},
      include: {
        quest: {
          select: { category: true, reward: true }
        }
      }
    });

    const categoryStats = achievements.reduce((acc: any, achievement) => {
      const category = achievement.quest.category;
      if (!acc[category]) {
        acc[category] = { category, count: 0, totalReward: 0 };
      }
      acc[category].count++;
      acc[category].totalReward += achievement.quest.reward;
      return acc;
    }, {});

    return Object.values(categoryStats).sort((a: any, b: any) => b.totalReward - a.totalReward);
  }

  private async getDifficultyStats(dateFilter: any): Promise<any[]> {
    const achievements = await prisma.achievement.findMany({
      where: dateFilter ? { earnedAt: dateFilter } : {},
      include: {
        quest: {
          select: { difficulty: true, reward: true }
        }
      }
    });

    const difficultyStats = achievements.reduce((acc: any, achievement) => {
      const difficulty = achievement.quest.difficulty;
      if (!acc[difficulty]) {
        acc[difficulty] = { difficulty, count: 0, totalReward: 0 };
      }
      acc[difficulty].count++;
      acc[difficulty].totalReward += achievement.quest.reward;
      return acc;
    }, {});

    return Object.values(difficultyStats).sort((a: any, b: any) => b.totalReward - a.totalReward);
  }

  private async getRecentLeaderboardActivity(limit: number, dateFilter: any): Promise<any[]> {
    const achievementWhere = dateFilter ? { earnedAt: dateFilter } : {};
    
    const recentAchievements = await prisma.achievement.findMany({
      where: achievementWhere,
      include: {
        user: {
          select: { id: true, email: true }
        },
        quest: {
          select: { title: true, category: true, difficulty: true, reward: true }
        }
      },
      orderBy: { earnedAt: 'desc' },
      take: limit
    });

    return recentAchievements.map(achievement => ({
      type: 'achievement',
      user: achievement.user,
      quest: achievement.quest,
      timestamp: achievement.earnedAt
    }));
  }
}
