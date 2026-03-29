import { PrismaClient } from '@prisma/client';
import { IDashboardService, IDashboardStats, ITimeRangeFilter } from './interfaces';
import { DashboardError } from './utils';

const prisma = new PrismaClient();

export class DashboardService implements IDashboardService {
  async getDashboardStats(timeRange: ITimeRangeFilter = 'all'): Promise<IDashboardStats> {
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

    // Execute all queries in parallel for better performance
    const [
      totalUsers,
      activeUsers,
      totalQuests,
      activeQuests,
      totalSubmissions,
      pendingSubmissions,
      approvedSubmissions,
      rejectedSubmissions,
      totalAchievements,
      totalPointsAwarded,
      topUsers,
      questStats,
      recentActivity,
      submissionTrends,
      achievementTrends
    ] = await Promise.all([
      // User stats
      prisma.user.count(),
      this.getActiveUsersCount(dateFilter),
      
      // Quest stats
      prisma.quest.count(),
      prisma.quest.count({ where: { isActive: true } }),
      
      // Submission stats
      this.getSubmissionsCount(dateFilter),
      this.getSubmissionsCount(dateFilter, 'pending'),
      this.getSubmissionsCount(dateFilter, 'approved'),
      this.getSubmissionsCount(dateFilter, 'rejected'),
      
      // Achievement stats
      this.getAchievementsCount(dateFilter),
      this.getTotalPointsAwarded(dateFilter),
      
      // Top users
      this.getTopUsers(5, dateFilter),
      
      // Quest performance
      this.getQuestPerformanceStats(dateFilter),
      
      // Recent activity
      this.getRecentActivity(10, dateFilter),
      
      // Trends
      this.getSubmissionTrends(dateFilter),
      this.getAchievementTrends(dateFilter)
    ]);

    return {
      overview: {
        totalUsers,
        activeUsers,
        totalQuests,
        activeQuests,
        totalSubmissions,
        pendingSubmissions,
        approvedSubmissions,
        rejectedSubmissions,
        totalAchievements,
        totalPointsAwarded,
        approvalRate: totalSubmissions > 0 ? Math.round((approvedSubmissions / totalSubmissions) * 100 * 100) / 100 : 0
      },
      topUsers,
      questStats,
      recentActivity,
      trends: {
        submissions: submissionTrends,
        achievements: achievementTrends
      },
      timeRange
    };
  }

  async getUserDashboardStats(userId: string, timeRange: ITimeRangeFilter = 'all'): Promise<{
    overview: {
      totalSubmissions: number;
      approvedSubmissions: number;
      rejectedSubmissions: number;
      pendingSubmissions: number;
      totalAchievements: number;
      totalPoints: number;
      approvalRate: number;
    };
    recentActivity: any[];
    progressByCategory: Record<string, { completed: number; total: number; percentage: number }>;
    progressByDifficulty: Record<string, { completed: number; total: number; percentage: number }>;
    monthlyProgress: any[];
  }> {
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
      userSubmissions,
      userAchievements,
      userProfile,
      recentActivity,
      monthlyProgress
    ] = await Promise.all([
      prisma.submission.findMany({
        where: { userId, ...(dateFilter && { submittedAt: dateFilter }) },
        include: {
          quest: {
            select: {
              category: true,
              difficulty: true
            }
          }
        }
      }),
      prisma.achievement.findMany({
        where: { userId, ...(dateFilter && { earnedAt: dateFilter }) },
        include: {
          quest: {
            select: {
              category: true,
              difficulty: true,
              reward: true
            }
          }
        }
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { points: true }
      }),
      this.getUserRecentActivity(userId, 10, dateFilter),
      this.getUserMonthlyProgress(userId, dateFilter)
    ]);

    const totalSubmissions = userSubmissions.length;
    const approvedSubmissions = userSubmissions.filter(s => s.status === 'approved').length;
    const rejectedSubmissions = userSubmissions.filter(s => s.status === 'rejected').length;
    const pendingSubmissions = userSubmissions.filter(s => s.status === 'pending').length;
    const totalAchievements = userAchievements.length;
    const totalPoints = userProfile?.points || 0;
    const approvalRate = totalSubmissions > 0 ? Math.round((approvedSubmissions / totalSubmissions) * 100 * 100) / 100 : 0;

    // Calculate progress by category
    const progressByCategory = this.calculateProgressByCategory(userAchievements, userSubmissions);
    
    // Calculate progress by difficulty
    const progressByDifficulty = this.calculateProgressByDifficulty(userAchievements, userSubmissions);

    return {
      overview: {
        totalSubmissions,
        approvedSubmissions,
        rejectedSubmissions,
        pendingSubmissions,
        totalAchievements,
        totalPoints,
        approvalRate
      },
      recentActivity,
      progressByCategory,
      progressByDifficulty,
      monthlyProgress
    };
  }

  async getQuestAnalytics(questId: string, timeRange: ITimeRangeFilter = 'all'): Promise<{
    quest: {
      id: string;
      title: string;
      description: string;
      reward: number;
      difficulty: string;
      category: string;
      isActive: boolean;
    };
    stats: {
      totalSubmissions: number;
      approvedSubmissions: number;
      rejectedSubmissions: number;
      pendingSubmissions: number;
      approvalRate: number;
      totalAchievements: number;
      completionRate: number;
      averageTimeToComplete: number;
    };
    trends: any[];
    topPerformers: {
      user: {
        id: string;
        email: string;
      };
      submittedAt: Date;
      status: string;
    }[];
  }> {
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

    const [quest, submissions, achievements, totalUsers] = await Promise.all([
      prisma.quest.findUnique({
        where: { id: questId }
      }),
      prisma.submission.findMany({
        where: { 
          questId,
          ...(dateFilter && { submittedAt: dateFilter })
        },
        include: {
          user: {
            select: {
              id: true,
              email: true
            }
          }
        },
        orderBy: { submittedAt: 'desc' }
      }),
      prisma.achievement.findMany({
        where: { 
          questId,
          ...(dateFilter && { earnedAt: dateFilter })
        }
      }),
      prisma.user.count()
    ]);

    if (!quest) {
      throw new DashboardError('Quest not found', 404);
    }

    const totalSubmissions = submissions.length;
    const approvedSubmissions = submissions.filter(s => s.status === 'approved').length;
    const rejectedSubmissions = submissions.filter(s => s.status === 'rejected').length;
    const pendingSubmissions = submissions.filter(s => s.status === 'pending').length;
    const totalAchievements = achievements.length;
    const approvalRate = totalSubmissions > 0 ? Math.round((approvedSubmissions / totalSubmissions) * 100 * 100) / 100 : 0;
    const completionRate = totalUsers > 0 ? Math.round((totalAchievements / totalUsers) * 100 * 100) / 100 : 0;

    // Calculate average time to complete (from first submission to approval)
    const completedSubmissions = submissions.filter(s => s.status === 'approved');
    const averageTimeToComplete = completedSubmissions.length > 0 
      ? this.calculateAverageCompletionTime(completedSubmissions)
      : 0;

    const topPerformers = submissions.slice(0, 10).map(s => ({
      user: s.user,
      submittedAt: s.submittedAt,
      status: s.status
    }));

    const trends = await this.getQuestSubmissionTrends(questId, dateFilter);

    return {
      quest,
      stats: {
        totalSubmissions,
        approvedSubmissions,
        rejectedSubmissions,
        pendingSubmissions,
        approvalRate,
        totalAchievements,
        completionRate,
        averageTimeToComplete
      },
      trends,
      topPerformers
    };
  }

  // Helper methods
  private async getActiveUsersCount(dateFilter: any): Promise<number> {
    if (Object.keys(dateFilter).length === 0) {
      // For "all" time range, get users with any activity
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

  private async getSubmissionsCount(dateFilter: any, status?: string): Promise<number> {
    const where: any = dateFilter ? { submittedAt: dateFilter } : {};
    if (status) where.status = status;
    
    return prisma.submission.count({ where });
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

  private async getTopUsers(limit: number, dateFilter: any): Promise<any[]> {
    const where = dateFilter ? { earnedAt: dateFilter } : {};
    
    const userStats = await prisma.achievement.groupBy({
      by: ['userId'],
      where,
      _count: { userId: true }
    });

    const users = await Promise.all(
      userStats.map(async (stat) => {
        const user = await prisma.user.findUnique({
          where: { id: stat.userId },
          select: { id: true, email: true, points: true }
        });

        if (!user) return null;

        const userAchievements = await prisma.achievement.findMany({
          where: { userId: stat.userId, ...where },
          include: {
            quest: { select: { reward: true } }
          }
        });

        const totalReward = userAchievements.reduce((sum, ach) => sum + ach.quest.reward, 0);

        return {
          ...user,
          achievementCount: stat._count.userId,
          totalReward
        };
      })
    );

    return users
      .filter((user): user is NonNullable<typeof user> => user !== null)
      .sort((a, b) => b.totalReward - a.totalReward)
      .slice(0, limit);
  }

  private async getQuestPerformanceStats(dateFilter: any): Promise<any[]> {
    const where = dateFilter ? { submittedAt: dateFilter } : {};
    
    const questStats = await prisma.submission.groupBy({
      by: ['questId'],
      where,
      _count: { questId: true }
    });

    const quests = await Promise.all(
      questStats.map(async (stat) => {
        const quest = await prisma.quest.findUnique({
          where: { id: stat.questId },
          select: {
            id: true,
            title: true,
            category: true,
            difficulty: true,
            reward: true
          }
        });

        if (!quest) return null;

        const [approved, rejected, achievements] = await Promise.all([
          prisma.submission.count({ where: { questId: stat.questId, status: 'approved', ...where } }),
          prisma.submission.count({ where: { questId: stat.questId, status: 'rejected', ...where } }),
          prisma.achievement.count({ where: { questId: stat.questId, ...where } })
        ]);

        return {
          ...quest,
          totalSubmissions: stat._count.questId,
          approvedSubmissions: approved,
          rejectedSubmissions: rejected,
          totalAchievements: achievements,
          approvalRate: stat._count.questId > 0 ? Math.round((approved / stat._count.questId) * 100 * 100) / 100 : 0
        };
      })
    );

    return quests
      .filter((quest): quest is NonNullable<typeof quest> => quest !== null)
      .sort((a, b) => b.totalSubmissions - a.totalSubmissions)
      .slice(0, 10);
  }

  private async getRecentActivity(limit: number, dateFilter: any): Promise<any[]> {
    const submissionWhere = dateFilter ? { submittedAt: dateFilter } : {};
    const achievementWhere = dateFilter ? { earnedAt: dateFilter } : {};

    const [recentSubmissions, recentAchievements] = await Promise.all([
      prisma.submission.findMany({
        where: submissionWhere,
        include: {
          user: { select: { id: true, email: true } },
          quest: { select: { id: true, title: true } }
        },
        orderBy: { submittedAt: 'desc' },
        take: limit
      }),
      prisma.achievement.findMany({
        where: achievementWhere,
        include: {
          user: { select: { id: true, email: true } },
          quest: { select: { id: true, title: true, reward: true } }
        },
        orderBy: { earnedAt: 'desc' },
        take: limit
      })
    ]);

    const activities = [
      ...recentSubmissions.map(s => ({
        type: 'submission',
        id: s.id,
        user: s.user,
        quest: s.quest,
        status: s.status,
        timestamp: s.submittedAt
      })),
      ...recentAchievements.map(a => ({
        type: 'achievement',
        id: a.id,
        user: a.user,
        quest: a.quest,
        reward: a.quest.reward,
        timestamp: a.earnedAt
      }))
    ];

    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  private async getSubmissionTrends(dateFilter: any): Promise<any[]> {
    // Simplified trend data - in production, this would be more sophisticated
    const where = dateFilter ? { submittedAt: dateFilter } : {};
    
    const submissions = await prisma.submission.findMany({
      where,
      select: { submittedAt: true, status: true }
    });

    // Group by date
    const trends = submissions.reduce((acc: any, submission) => {
      const date = submission.submittedAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, total: 0, approved: 0, rejected: 0, pending: 0 };
      }
      acc[date].total++;
      acc[date][submission.status]++;
      return acc;
    }, {});

    return Object.values(trends).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }

  private async getAchievementTrends(dateFilter: any): Promise<any[]> {
    const where = dateFilter ? { earnedAt: dateFilter } : {};
    
    const achievements = await prisma.achievement.findMany({
      where,
      select: { earnedAt: true },
      include: {
        quest: { select: { category: true, difficulty: true } }
      }
    });

    // Group by date
    const trends = achievements.reduce((acc: any, achievement) => {
      const date = achievement.earnedAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, total: 0, byCategory: {}, byDifficulty: {} };
      }
      acc[date].total++;
      
      const category = achievement.quest.category;
      const difficulty = achievement.quest.difficulty;
      
      acc[date].byCategory[category] = (acc[date].byCategory[category] || 0) + 1;
      acc[date].byDifficulty[difficulty] = (acc[date].byDifficulty[difficulty] || 0) + 1;
      
      return acc;
    }, {});

    return Object.values(trends).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }

  private async getUserRecentActivity(userId: string, limit: number, dateFilter: any): Promise<any[]> {
    const submissionWhere = { userId, ...(dateFilter && { submittedAt: dateFilter }) };
    const achievementWhere = { userId, ...(dateFilter && { earnedAt: dateFilter }) };

    const [recentSubmissions, recentAchievements] = await Promise.all([
      prisma.submission.findMany({
        where: submissionWhere,
        include: {
          quest: { select: { id: true, title: true } }
        },
        orderBy: { submittedAt: 'desc' },
        take: limit
      }),
      prisma.achievement.findMany({
        where: achievementWhere,
        include: {
          quest: { select: { id: true, title: true, reward: true } }
        },
        orderBy: { earnedAt: 'desc' },
        take: limit
      })
    ]);

    const activities = [
      ...recentSubmissions.map(s => ({
        type: 'submission',
        quest: s.quest,
        status: s.status,
        timestamp: s.submittedAt
      })),
      ...recentAchievements.map(a => ({
        type: 'achievement',
        quest: a.quest,
        reward: a.quest.reward,
        timestamp: a.earnedAt
      }))
    ];

    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  private async getUserMonthlyProgress(userId: string, dateFilter: any): Promise<any[]> {
    const where = { userId, ...(dateFilter && { earnedAt: dateFilter }) };
    
    const achievements = await prisma.achievement.findMany({
      where,
      select: { earnedAt: true },
      include: {
        quest: { select: { reward: true } }
      }
    });

    // Group by month
    const monthlyData = achievements.reduce((acc: any, achievement) => {
      const month = achievement.earnedAt.toISOString().slice(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { month, achievements: 0, points: 0 };
      }
      acc[month].achievements++;
      acc[month].points += achievement.quest.reward;
      return acc;
    }, {});

    return Object.values(monthlyData).sort((a: any, b: any) => a.month.localeCompare(b.month));
  }

  private calculateProgressByCategory(achievements: any[], submissions: any[]): Record<string, { completed: number; total: number; percentage: number }> {
    const categoryStats: Record<string, { completed: number; total: number }> = {};
    
    // Count submissions by category
    submissions.forEach(submission => {
      const category = submission.quest.category;
      if (!categoryStats[category]) {
        categoryStats[category] = { completed: 0, total: 0 };
      }
      categoryStats[category].total++;
    });

    // Count completed achievements by category
    achievements.forEach(achievement => {
      const category = achievement.quest.category;
      if (categoryStats[category]) {
        categoryStats[category].completed++;
      }
    });

    // Calculate percentages
    const result: Record<string, { completed: number; total: number; percentage: number }> = {};
    Object.entries(categoryStats).forEach(([category, stats]) => {
      result[category] = {
        ...stats,
        percentage: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100 * 100) / 100 : 0
      };
    });

    return result;
  }

  private calculateProgressByDifficulty(achievements: any[], submissions: any[]): Record<string, { completed: number; total: number; percentage: number }> {
    const difficultyStats: Record<string, { completed: number; total: number }> = {};
    
    // Count submissions by difficulty
    submissions.forEach(submission => {
      const difficulty = submission.quest.difficulty;
      if (!difficultyStats[difficulty]) {
        difficultyStats[difficulty] = { completed: 0, total: 0 };
      }
      difficultyStats[difficulty].total++;
    });

    // Count completed achievements by difficulty
    achievements.forEach(achievement => {
      const difficulty = achievement.quest.difficulty;
      if (difficultyStats[difficulty]) {
        difficultyStats[difficulty].completed++;
      }
    });

    // Calculate percentages
    const result: Record<string, { completed: number; total: number; percentage: number }> = {};
    Object.entries(difficultyStats).forEach(([difficulty, stats]) => {
      result[difficulty] = {
        ...stats,
        percentage: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100 * 100) / 100 : 0
      };
    });

    return result;
  }

  private calculateAverageCompletionTime(completedSubmissions: any[]): number {
    if (completedSubmissions.length === 0) return 0;

    const totalTime = completedSubmissions.reduce((sum, submission) => {
      // This is simplified - in production, you'd track actual completion time
      // For now, we'll use a placeholder calculation
      return sum + (24 * 60 * 60 * 1000); // Assume 24 hours average
    }, 0);

    return Math.round(totalTime / completedSubmissions.length / (1000 * 60 * 60)); // Return in hours
  }

  private async getQuestSubmissionTrends(questId: string, dateFilter: any): Promise<any[]> {
    const where = { questId, ...(dateFilter && { submittedAt: dateFilter }) };
    
    const submissions = await prisma.submission.findMany({
      where,
      select: { submittedAt: true, status: true }
    });

    // Group by date
    const trends = submissions.reduce((acc: any, submission) => {
      const date = submission.submittedAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, total: 0, approved: 0, rejected: 0, pending: 0 };
      }
      acc[date].total++;
      acc[date][submission.status]++;
      return acc;
    }, {});

    return Object.values(trends).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }
}
