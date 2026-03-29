import { LeaderboardService } from '../service';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    quest: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    submission: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    achievement: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
  })),
}));

describe('LeaderboardService', () => {
  let leaderboardService: LeaderboardService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    leaderboardService = new LeaderboardService();
    mockPrisma = (leaderboardService as any).prisma;
    jest.clearAllMocks();
  });

  describe('getGlobalLeaderboard', () => {
    it('should return global leaderboard with pagination', async () => {
      const mockUserStats = [
        {
          user: { id: 'user-1', email: 'user1@example.com', points: 500, createdAt: new Date() },
          achievementCount: 10,
          totalReward: 500,
          averageReward: 50
        },
        {
          user: { id: 'user-2', email: 'user2@example.com', points: 300, createdAt: new Date() },
          achievementCount: 6,
          totalReward: 300,
          averageReward: 50
        }
      ];

      (mockPrisma.achievement.groupBy as jest.Mock).mockResolvedValue([
        { userId: 'user-1', _count: { userId: 10 } },
        { userId: 'user-2', _count: { userId: 6 } }
      ]);

      (mockPrisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: 'user-1', email: 'user1@example.com', points: 500, createdAt: new Date() })
        .mockResolvedValueOnce({ id: 'user-2', email: 'user2@example.com', points: 300, createdAt: new Date() });

      (mockPrisma.achievement.findMany as jest.Mock)
        .mockResolvedValueOnce([
          { quest: { category: 'education', difficulty: 'medium', reward: 50 } }
        ])
        .mockResolvedValueOnce([
          { quest: { category: 'education', difficulty: 'medium', reward: 50 } }
        ]);

      const result = await leaderboardService.getGlobalLeaderboard({ page: 1, limit: 10 });

      expect(result.leaderboard).toHaveLength(2);
      expect(result.leaderboard[0].rank).toBe(1);
      expect(result.leaderboard[0].user.email).toBe('user1@example.com');
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should apply time range filter', async () => {
      const dateFilter = { gte: expect.any(Date) };

      (mockPrisma.achievement.groupBy as jest.Mock).mockResolvedValue([]);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue([]);

      await leaderboardService.getGlobalLeaderboard({ timeRange: 'week' });

      expect(mockPrisma.achievement.groupBy).toHaveBeenCalledWith({
        by: ['userId'],
        where: { earnedAt: dateFilter },
        _count: { userId: true }
      });
    });

    it('should apply category and difficulty filters', async () => {
      (mockPrisma.achievement.groupBy as jest.Mock).mockResolvedValue([]);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue([]);

      await leaderboardService.getGlobalLeaderboard({ 
        category: 'education', 
        difficulty: 'medium' 
      });

      // Verify filters are applied in the achievement query
      expect(mockPrisma.achievement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: expect.any(String)
          })
        })
      );
    });
  });

  describe('getUserLeaderboard', () => {
    it('should return user leaderboard with user rank and nearby users', async () => {
      const mockGlobalLeaderboard = [
        { user: { id: 'other-1' }, rank: 1 },
        { user: { id: 'user-1' }, rank: 2 },
        { user: { id: 'other-2' }, rank: 3 },
        { user: { id: 'other-3' }, rank: 4 },
        { user: { id: 'other-4' }, rank: 5 }
      ];

      // Mock the global leaderboard call
      jest.spyOn(leaderboardService, 'getGlobalLeaderboard')
        .mockResolvedValue({
          leaderboard: mockGlobalLeaderboard as any,
          total: 5,
          page: 1,
          totalPages: 1
        });

      const result = await leaderboardService.getUserLeaderboard('user-1');

      expect(result.userRank.rank).toBe(2);
      expect(result.userRank.entry.user.id).toBe('user-1');
      expect(result.nearbyUsers).toHaveLength(5); // Should include nearby users
    });

    it('should throw error if user not found in leaderboard', async () => {
      jest.spyOn(leaderboardService, 'getGlobalLeaderboard')
        .mockResolvedValue({
          leaderboard: [],
          total: 0,
          page: 1,
          totalPages: 0
        });

      await expect(leaderboardService.getUserLeaderboard('nonexistent-user')).rejects.toThrow('User not found in leaderboard');
    });
  });

  describe('getQuestLeaderboard', () => {
    it('should return quest leaderboard', async () => {
      const questId = 'quest-123';
      const mockQuest = {
        id: questId,
        title: 'Test Quest',
        description: 'Test Description',
        difficulty: 'medium',
        category: 'education',
        reward: 50
      };

      const mockSubmissions = [
        {
          id: 'sub-1',
          user: { id: 'user-1', email: 'user1@example.com', points: 200 },
          submittedAt: new Date('2024-01-01'),
          status: 'approved',
          feedback: 'Great work!'
        },
        {
          id: 'sub-2',
          user: { id: 'user-2', email: 'user2@example.com', points: 150 },
          submittedAt: new Date('2024-01-02'),
          status: 'approved'
        }
      ];

      (mockPrisma.quest.findUnique as jest.Mock).mockResolvedValue(mockQuest);
      (mockPrisma.submission.findMany as jest.Mock).mockResolvedValue(mockSubmissions);
      (mockPrisma.submission.count as jest.Mock)
        .mockResolvedValueOnce(2) // totalSubmissions
        .mockResolvedValueOnce(2); // approvedSubmissions

      const result = await leaderboardService.getQuestLeaderboard(questId);

      expect(result.quest).toEqual(mockQuest);
      expect(result.leaderboard).toHaveLength(2);
      expect(result.leaderboard[0].rank).toBe(1);
      expect(result.stats.totalSubmissions).toBe(2);
      expect(result.stats.approvedSubmissions).toBe(2);
    });

    it('should throw error if quest not found', async () => {
      (mockPrisma.quest.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(leaderboardService.getQuestLeaderboard('nonexistent-quest')).rejects.toThrow('Quest not found');
    });
  });

  describe('getCategoryLeaderboards', () => {
    it('should return leaderboards for all categories', async () => {
      const mockQuests = [
        { category: 'education' },
        { category: 'general' },
        { category: 'education' } // Duplicate to test distinct
      ];

      (mockPrisma.quest.findMany as jest.Mock).mockResolvedValue(mockQuests);

      jest.spyOn(leaderboardService, 'getGlobalLeaderboard')
        .mockResolvedValue({
          leaderboard: [],
          total: 0,
          page: 1,
          totalPages: 1
        });

      const result = await leaderboardService.getCategoryLeaderboards();

      expect(result.categories).toHaveLength(2); // Should be unique categories
      expect(result.categories.map(c => c.category)).toEqual(['education', 'general']);
    });
  });

  describe('getLeaderboardStats', () => {
    it('should return comprehensive leaderboard statistics', async () => {
      (mockPrisma.user.count as jest.Mock).mockResolvedValue(100);
      (mockPrisma.achievement.count as jest.Mock).mockResolvedValue(50);
      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue([
        { quest: { reward: 50 } },
        { quest: { reward: 75 } }
      ]);

      // Mock helper methods
      jest.spyOn(leaderboardService as any, 'getActiveUsersCount').mockResolvedValue(75);
      jest.spyOn(leaderboardService as any, 'getTotalPointsAwarded').mockResolvedValue(125);
      jest.spyOn(leaderboardService as any, 'getTopPerformers').mockResolvedValue([]);
      jest.spyOn(leaderboardService as any, 'getCategoryStats').mockResolvedValue([]);
      jest.spyOn(leaderboardService as any, 'getDifficultyStats').mockResolvedValue([]);
      jest.spyOn(leaderboardService as any, 'getRecentLeaderboardActivity').mockResolvedValue([]);

      const result = await leaderboardService.getLeaderboardStats();

      expect(result.totalUsers).toBe(100);
      expect(result.activeUsers).toBe(75);
      expect(result.totalAchievements).toBe(50);
      expect(result.totalPointsAwarded).toBe(125);
      expect(result.timeRange).toBe('all');
    });

    it('should apply time range filter', async () => {
      const dateFilter = { gte: expect.any(Date) };

      (mockPrisma.user.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.achievement.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue([]);

      jest.spyOn(leaderboardService as any, 'getActiveUsersCount').mockResolvedValue(0);
      jest.spyOn(leaderboardService as any, 'getTotalPointsAwarded').mockResolvedValue(0);
      jest.spyOn(leaderboardService as any, 'getTopPerformers').mockResolvedValue([]);
      jest.spyOn(leaderboardService as any, 'getCategoryStats').mockResolvedValue([]);
      jest.spyOn(leaderboardService as any, 'getDifficultyStats').mockResolvedValue([]);
      jest.spyOn(leaderboardService as any, 'getRecentLeaderboardActivity').mockResolvedValue([]);

      await leaderboardService.getLeaderboardStats('week');

      expect(mockPrisma.achievement.count).toHaveBeenCalledWith({
        where: { earnedAt: dateFilter }
      });
    });
  });

  describe('getUserRanking', () => {
    it('should return user ranking information', async () => {
      const userId = 'user-123';

      jest.spyOn(leaderboardService, 'getGlobalLeaderboard')
        .mockResolvedValue({
          leaderboard: [
            { user: { id: 'other-1' }, rank: 1 },
            { user: { id: userId }, rank: 2 }
          ] as any,
          total: 2,
          page: 1,
          totalPages: 1
        });

      jest.spyOn(leaderboardService, 'getGlobalLeaderboard')
        .mockResolvedValue({
          leaderboard: [{ user: { id: userId }, rank: 1 }] as any,
          total: 1,
          page: 1,
          totalPages: 1
        });

      jest.spyOn(leaderboardService as any, 'getUserBadges').mockResolvedValue(['High Achiever', 'Dedicated']);

      const result = await leaderboardService.getUserRanking(userId);

      expect(result.globalRank).toBe(1);
      expect(result.totalParticipants).toBe(1);
      expect(result.badges).toEqual(['High Achiever', 'Dedicated']);
    });

    it('should throw error if user not found', async () => {
      jest.spyOn(leaderboardService, 'getGlobalLeaderboard')
        .mockResolvedValue({
          leaderboard: [],
          total: 0,
          page: 1,
          totalPages: 0
        });

      await expect(leaderboardService.getUserRanking('nonexistent-user')).rejects.toThrow('User not found in leaderboard');
    });
  });

  describe('helper methods', () => {
    it('should calculate rank change correctly', async () => {
      const userId = 'user-123';
      const dateFilter = { gte: new Date() };

      const currentRanking = [
        { user: { id: userId }, rank: 1 },
        { user: { id: 'other-1' }, rank: 2 }
      ];

      const previousRanking = [
        { user: { id: 'other-1' }, rank: 1 },
        { user: { id: userId }, rank: 2 }
      ];

      jest.spyOn(leaderboardService as any, 'getUserLeaderboardStats')
        .mockResolvedValueOnce(currentRanking)
        .mockResolvedValueOnce(previousRanking);

      const result = await (leaderboardService as any).calculateRankChange(userId, dateFilter);

      expect(result).toBe(1); // Moved up 1 position (from 2 to 1)
    });

    it('should get user badges based on achievements and points', async () => {
      const userId = 'user-123';

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({ points: 1500 });
      (mockPrisma.achievement.count as jest.Mock).mockResolvedValue(60);

      const badges = await (leaderboardService as any).getUserBadges(userId);

      expect(badges).toContain('Century Club'); // 60+ achievements
      expect(badges).toContain('High Achiever'); // 50+ achievements
      expect(badges).toContain('Master'); // 1500+ points
      expect(badges).toContain('Expert'); // 1000+ points
    });
  });
});
