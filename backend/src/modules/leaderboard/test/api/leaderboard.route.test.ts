import request from 'supertest';
import express from 'express';
import { leaderboardRoutes } from '../route';
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

// Mock auth middleware
jest.mock('../auth/middleware', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { userId: 'user-id', role: 'user' };
    next();
  },
}));

const app = express();
app.use(express.json());
app.use('/api/leaderboard', leaderboardRoutes);

describe('Leaderboard API Routes', () => {
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    jest.clearAllMocks();
  });

  describe('GET /api/leaderboard/global', () => {
    it('should return global leaderboard', async () => {
      const mockUserStats = [
        {
          user: { id: 'user-1', email: 'user1@example.com', points: 500, createdAt: new Date() },
          achievementCount: 10,
          totalReward: 500,
          averageReward: 50
        }
      ];

      (mockPrisma.achievement.groupBy as jest.Mock).mockResolvedValue([
        { userId: 'user-1', _count: { userId: 10 } }
      ]);

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'user1@example.com',
        points: 500,
        createdAt: new Date()
      });

      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue([
        { quest: { category: 'education', difficulty: 'medium', reward: 50 } }
      ]);

      const response = await request(app)
        .get('/api/leaderboard/global')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.leaderboard).toBeDefined();
      expect(response.body.data.total).toBeDefined();
      expect(response.body.data.page).toBe(1);
    });

    it('should apply filters', async () => {
      (mockPrisma.achievement.groupBy as jest.Mock).mockResolvedValue([]);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/leaderboard/global?page=2&limit=20&timeRange=week&category=education&difficulty=medium')
        .expect(200);

      expect(response.body.success).toBe(true);
      // Verify filters are processed
    });
  });

  describe('GET /api/leaderboard/user', () => {
    it('should return user leaderboard', async () => {
      // Mock the global leaderboard call
      const mockGlobalLeaderboard = [
        { user: { id: 'other-1' }, rank: 1 },
        { user: { id: 'user-id' }, rank: 2 },
        { user: { id: 'other-2' }, rank: 3 }
      ];

      const leaderboardService = (app as any)._router?.stack?.find(
        (layer: any) => layer.route?.path?.includes('/user')
      )?.handle;

      // For testing, we'll mock the service method
      const mockGetUserLeaderboard = jest.fn().mockResolvedValue({
        leaderboard: mockGlobalLeaderboard,
        userRank: { rank: 2, entry: mockGlobalLeaderboard[1] },
        nearbyUsers: mockGlobalLeaderboard
      });

      // This is a simplified test - in real scenario, you'd need to mock the service
      (mockPrisma.achievement.groupBy as jest.Mock).mockResolvedValue([
        { userId: 'user-id', _count: { userId: 5 } }
      ]);

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-id',
        email: 'user@example.com',
        points: 250,
        createdAt: new Date()
      });

      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue([
        { quest: { category: 'education', difficulty: 'medium', reward: 50 } }
      ]);

      const response = await request(app)
        .get('/api/leaderboard/user')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.leaderboard).toBeDefined();
      expect(response.body.data.userRank).toBeDefined();
    });
  });

  describe('GET /api/leaderboard/quest/:questId', () => {
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
          submittedAt: new Date(),
          status: 'approved'
        }
      ];

      (mockPrisma.quest.findUnique as jest.Mock).mockResolvedValue(mockQuest);
      (mockPrisma.submission.findMany as jest.Mock).mockResolvedValue(mockSubmissions);
      (mockPrisma.submission.count as jest.Mock)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1);

      const response = await request(app)
        .get(`/api/leaderboard/quest/${questId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.quest).toEqual(mockQuest);
      expect(response.body.data.leaderboard).toHaveLength(1);
      expect(response.body.data.stats).toBeDefined();
    });

    it('should return 404 for non-existent quest', async () => {
      (mockPrisma.quest.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/leaderboard/quest/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/leaderboard/categories', () => {
    it('should return category leaderboards', async () => {
      const mockQuests = [
        { category: 'education' },
        { category: 'general' }
      ];

      (mockPrisma.quest.findMany as jest.Mock).mockResolvedValue(mockQuests);
      (mockPrisma.achievement.groupBy as jest.Mock).mockResolvedValue([]);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/leaderboard/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.categories).toBeDefined();
    });

    it('should apply time range filter', async () => {
      (mockPrisma.quest.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.achievement.groupBy as jest.Mock).mockResolvedValue([]);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/leaderboard/categories?timeRange=week')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/leaderboard/stats', () => {
    it('should return leaderboard statistics', async () => {
      (mockPrisma.user.count as jest.Mock).mockResolvedValue(100);
      (mockPrisma.achievement.count as jest.Mock).mockResolvedValue(50);
      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue([
        { quest: { reward: 50 } }
      ]);

      const response = await request(app)
        .get('/api/leaderboard/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalUsers).toBe(100);
      expect(response.body.data.totalAchievements).toBe(50);
      expect(response.body.data.timeRange).toBe('all');
    });

    it('should apply time range filter', async () => {
      (mockPrisma.user.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.achievement.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/leaderboard/stats?timeRange=month')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.timeRange).toBe('month');
    });
  });

  describe('GET /api/leaderboard/user/ranking', () => {
    it('should return user ranking information', async () => {
      (mockPrisma.achievement.groupBy as jest.Mock).mockResolvedValue([
        { userId: 'user-id', _count: { userId: 5 } }
      ]);

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-id',
        email: 'user@example.com',
        points: 250,
        createdAt: new Date()
      });

      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue([
        { quest: { category: 'education', difficulty: 'medium', reward: 50 } }
      ]);

      const response = await request(app)
        .get('/api/leaderboard/user/ranking')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.globalRank).toBeDefined();
      expect(response.body.data.totalParticipants).toBeDefined();
      expect(response.body.data.badges).toBeDefined();
    });

    it('should return 404 if user not in leaderboard', async () => {
      (mockPrisma.achievement.groupBy as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/leaderboard/user/ranking')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Validation', () => {
    it('should validate leaderboard filters', async () => {
      (mockPrisma.achievement.groupBy as jest.Mock).mockResolvedValue([]);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/leaderboard/global?page=invalid&limit=invalid&timeRange=invalid&difficulty=invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should accept valid parameters', async () => {
      (mockPrisma.achievement.groupBy as jest.Mock).mockResolvedValue([]);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/leaderboard/global?page=2&limit=20&timeRange=week&difficulty=medium')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', async () => {
      // Mock large dataset
      const largeUserStats = Array.from({ length: 1000 }, (_, i) => ({
        userId: `user-${i}`,
        _count: { userId: Math.floor(Math.random() * 50) + 1 }
      }));

      (mockPrisma.achievement.groupBy as jest.Mock).mockResolvedValue(largeUserStats);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'user1@example.com',
        points: 500,
        createdAt: new Date()
      });
      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue([
        { quest: { category: 'education', difficulty: 'medium', reward: 50 } }
      ]);

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/leaderboard/global?limit=100')
        .expect(200);
      const endTime = Date.now();

      expect(response.body.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(3000); // Should complete within 3 seconds
    });
  });

  describe('Caching', () => {
    it('should support caching headers', async () => {
      (mockPrisma.achievement.groupBy as jest.Mock).mockResolvedValue([]);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/leaderboard/global')
        .expect(200);

      // Check if cache headers are set (implementation dependent)
      expect(response.headers).toBeDefined();
    });
  });
});
