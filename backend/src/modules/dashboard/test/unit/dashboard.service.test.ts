import { DashboardService } from '../service';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    quest: {
      count: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    submission: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    achievement: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
  })),
}));

describe('DashboardService', () => {
  let dashboardService: DashboardService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    dashboardService = new DashboardService();
    mockPrisma = (dashboardService as any).prisma;
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should return comprehensive dashboard statistics', async () => {
      // Mock all the parallel queries
      (mockPrisma.user.count as jest.Mock)
        .mockResolvedValueOnce(100) // totalUsers
        .mockResolvedValueOnce(50);  // activeUsers
      
      (mockPrisma.quest.count as jest.Mock)
        .mockResolvedValueOnce(20)  // totalQuests
        .mockResolvedValueOnce(15); // activeQuests
      
      (mockPrisma.submission.count as jest.Mock)
        .mockResolvedValueOnce(200) // totalSubmissions
        .mockResolvedValueOnce(30)  // pendingSubmissions
        .mockResolvedValueOnce(150) // approvedSubmissions
        .mockResolvedValueOnce(20); // rejectedSubmissions
      
      (mockPrisma.achievement.count as jest.Mock).mockResolvedValue(180);
      
      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue([
        { quest: { reward: 50 } },
        { quest: { reward: 75 } }
      ]);
      
      (mockPrisma.submission.groupBy as jest.Mock).mockResolvedValue([
        { userId: 'user-1', _count: { userId: 5 } },
        { userId: 'user-2', _count: { userId: 3 } }
      ]);
      
      (mockPrisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: 'user-1', email: 'user1@example.com', points: 250 })
        .mockResolvedValueOnce({ id: 'user-2', email: 'user2@example.com', points: 150 });
      
      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue([
        { quest: { reward: 50 } },
        { quest: { reward: 100 } }
      ]);

      const result = await dashboardService.getDashboardStats();

      expect(result.overview).toEqual({
        totalUsers: 100,
        activeUsers: 50,
        totalQuests: 20,
        activeQuests: 15,
        totalSubmissions: 200,
        pendingSubmissions: 30,
        approvedSubmissions: 150,
        rejectedSubmissions: 20,
        totalAchievements: 180,
        totalPointsAwarded: 125,
        approvalRate: 75
      });

      expect(result.topUsers).toHaveLength(2);
      expect(result.timeRange).toBe('all');
    });

    it('should apply time range filter correctly', async () => {
      const dateFilter = { gte: expect.any(Date) };

      (mockPrisma.user.count as jest.Mock).mockResolvedValue(50);
      (mockPrisma.quest.count as jest.Mock).mockResolvedValue(10);
      (mockPrisma.submission.count as jest.Mock).mockResolvedValue(100);
      (mockPrisma.achievement.count as jest.Mock).mockResolvedValue(80);
      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.submission.groupBy as jest.Mock).mockResolvedValue([]);
      (mockPrisma.quest.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.submission.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue([]);

      await dashboardService.getDashboardStats('week');

      // Verify date filter is applied
      expect(mockPrisma.user.count).toHaveBeenCalledWith({
        where: {
          OR: [
            { submissions: { some: { submittedAt: dateFilter } } },
            { achievements: { some: { earnedAt: dateFilter } } }
          ]
        }
      });
    });
  });

  describe('getUserDashboardStats', () => {
    it('should return user-specific dashboard statistics', async () => {
      const userId = 'user-123';
      
      const mockSubmissions = [
        { 
          status: 'approved', 
          quest: { category: 'education', difficulty: 'easy' },
          submittedAt: new Date()
        },
        { 
          status: 'pending', 
          quest: { category: 'education', difficulty: 'medium' },
          submittedAt: new Date()
        }
      ];
      
      const mockAchievements = [
        { 
          quest: { category: 'education', difficulty: 'easy', reward: 50 },
          earnedAt: new Date()
        }
      ];
      
      const mockUser = { points: 150 };

      (mockPrisma.submission.findMany as jest.Mock).mockResolvedValue(mockSubmissions);
      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue(mockAchievements);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.submission.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue([]);

      const result = await dashboardService.getUserDashboardStats(userId);

      expect(result.overview).toEqual({
        totalSubmissions: 2,
        approvedSubmissions: 1,
        rejectedSubmissions: 0,
        pendingSubmissions: 1,
        totalAchievements: 1,
        totalPoints: 150,
        approvalRate: 50
      });

      expect(result.progressByCategory).toEqual({
        education: { completed: 1, total: 2, percentage: 50 }
      });

      expect(result.progressByDifficulty).toEqual({
        easy: { completed: 1, total: 1, percentage: 100 },
        medium: { completed: 0, total: 1, percentage: 0 }
      });
    });
  });

  describe('getQuestAnalytics', () => {
    it('should return quest-specific analytics', async () => {
      const questId = 'quest-123';
      
      const mockQuest = {
        id: questId,
        title: 'Test Quest',
        description: 'Test Description',
        reward: 50,
        difficulty: 'easy',
        category: 'education',
        isActive: true
      };
      
      const mockSubmissions = [
        { 
          status: 'approved',
          user: { id: 'user-1', email: 'user1@example.com' },
          submittedAt: new Date()
        },
        { 
          status: 'pending',
          user: { id: 'user-2', email: 'user2@example.com' },
          submittedAt: new Date()
        }
      ];
      
      const mockAchievements = [{ questId }];
      
      (mockPrisma.quest.findUnique as jest.Mock).mockResolvedValue(mockQuest);
      (mockPrisma.submission.findMany as jest.Mock).mockResolvedValue(mockSubmissions);
      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue(mockAchievements);
      (mockPrisma.user.count as jest.Mock).mockResolvedValue(100);
      (mockPrisma.submission.findMany as jest.Mock).mockResolvedValue([]);

      const result = await dashboardService.getQuestAnalytics(questId);

      expect(result.quest).toEqual(mockQuest);
      expect(result.stats).toEqual({
        totalSubmissions: 2,
        approvedSubmissions: 1,
        rejectedSubmissions: 0,
        pendingSubmissions: 1,
        approvalRate: 50,
        totalAchievements: 1,
        completionRate: 1,
        averageTimeToComplete: 24
      });

      expect(result.topPerformers).toHaveLength(2);
    });

    it('should throw error if quest not found', async () => {
      (mockPrisma.quest.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(dashboardService.getQuestAnalytics('nonexistent')).rejects.toThrow('Quest not found');
    });
  });

  describe('helper methods', () => {
    it('should calculate progress by category correctly', async () => {
      const achievements = [
        { quest: { category: 'education' } }
      ];
      
      const submissions = [
        { quest: { category: 'education' } },
        { quest: { category: 'education' } },
        { quest: { category: 'general' } }
      ];

      const service = new DashboardService();
      const result = (service as any).calculateProgressByCategory(achievements, submissions);

      expect(result).toEqual({
        education: { completed: 1, total: 2, percentage: 50 },
        general: { completed: 0, total: 1, percentage: 0 }
      });
    });

    it('should calculate progress by difficulty correctly', async () => {
      const achievements = [
        { quest: { difficulty: 'easy' } }
      ];
      
      const submissions = [
        { quest: { difficulty: 'easy' } },
        { quest: { difficulty: 'medium' } }
      ];

      const service = new DashboardService();
      const result = (service as any).calculateProgressByDifficulty(achievements, submissions);

      expect(result).toEqual({
        easy: { completed: 1, total: 1, percentage: 100 },
        medium: { completed: 0, total: 1, percentage: 0 }
      });
    });
  });
});
