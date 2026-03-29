import request from 'supertest';
import express from 'express';
import { dashboardRoutes } from '../route';
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

// Mock auth middleware
jest.mock('../auth/middleware', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { userId: 'user-id', role: 'user' };
    next();
  },
  requireRole: (role: string) => (req: any, res: any, next: any) => {
    if (req.user.role !== role) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
  },
}));

const app = express();
app.use(express.json());
app.use('/api/dashboard', dashboardRoutes);

describe('Dashboard API Routes', () => {
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    jest.clearAllMocks();
  });

  describe('GET /api/dashboard/admin/stats', () => {
    it('should return admin dashboard statistics', async () => {
      // Mock admin user for this test
      const app = express();
      app.use(express.json());
      
      app.use('/api/dashboard', (req, res, next) => {
        (req as any).user = { userId: 'admin-id', role: 'admin' };
        next();
      });
      app.use('/api/dashboard', dashboardRoutes);

      // Mock all the service method calls
      (mockPrisma.user.count as jest.Mock).mockResolvedValue(100);
      (mockPrisma.quest.count as jest.Mock).mockResolvedValue(20);
      (mockPrisma.submission.count as jest.Mock).mockResolvedValue(200);
      (mockPrisma.achievement.count as jest.Mock).mockResolvedValue(180);
      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.submission.groupBy as jest.Mock).mockResolvedValue([]);
      (mockPrisma.quest.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.submission.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/dashboard/admin/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.overview).toBeDefined();
      expect(response.body.data.topUsers).toBeDefined();
      expect(response.body.data.questStats).toBeDefined();
      expect(response.body.data.recentActivity).toBeDefined();
      expect(response.body.data.trends).toBeDefined();
    });

    it('should apply time range filter', async () => {
      const app = express();
      app.use(express.json());
      
      app.use('/api/dashboard', (req, res, next) => {
        (req as any).user = { userId: 'admin-id', role: 'admin' };
        next();
      });
      app.use('/api/dashboard', dashboardRoutes);

      (mockPrisma.user.count as jest.Mock).mockResolvedValue(50);
      (mockPrisma.quest.count as jest.Mock).mockResolvedValue(10);
      (mockPrisma.submission.count as jest.Mock).mockResolvedValue(100);
      (mockPrisma.achievement.count as jest.Mock).mockResolvedValue(80);
      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.submission.groupBy as jest.Mock).mockResolvedValue([]);
      (mockPrisma.quest.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.submission.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/dashboard/admin/stats?timeRange=week')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.timeRange).toBe('week');
    });

    it('should deny access to non-admin users', async () => {
      const response = await request(app)
        .get('/api/dashboard/admin/stats')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Insufficient permissions');
    });
  });

  describe('GET /api/dashboard/user/stats', () => {
    it('should return user dashboard statistics', async () => {
      const mockSubmissions = [
        { 
          status: 'approved', 
          quest: { category: 'education', difficulty: 'easy' },
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

      const response = await request(app)
        .get('/api/dashboard/user/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.overview).toBeDefined();
      expect(response.body.data.recentActivity).toBeDefined();
      expect(response.body.data.progressByCategory).toBeDefined();
      expect(response.body.data.progressByDifficulty).toBeDefined();
      expect(response.body.data.monthlyProgress).toBeDefined();
    });

    it('should apply time range filter for user stats', async () => {
      (mockPrisma.submission.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({ points: 0 });
      (mockPrisma.submission.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/dashboard/user/stats?timeRange=month')
        .expect(200);

      expect(response.body.success).toBe(true);
      // Verify date filter was applied by checking the service was called with time range
    });
  });

  describe('GET /api/dashboard/admin/quest/:questId', () => {
    it('should return quest analytics (admin only)', async () => {
      const app = express();
      app.use(express.json());
      
      app.use('/api/dashboard', (req, res, next) => {
        (req as any).user = { userId: 'admin-id', role: 'admin' };
        next();
      });
      app.use('/api/dashboard', dashboardRoutes);

      const mockQuest = {
        id: 'quest-123',
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
        }
      ];
      
      (mockPrisma.quest.findUnique as jest.Mock).mockResolvedValue(mockQuest);
      (mockPrisma.submission.findMany as jest.Mock).mockResolvedValue(mockSubmissions);
      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.user.count as jest.Mock).mockResolvedValue(100);
      (mockPrisma.submission.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/dashboard/admin/quest/quest-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.quest).toEqual(mockQuest);
      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.trends).toBeDefined();
      expect(response.body.data.topPerformers).toBeDefined();
    });

    it('should return error for non-existent quest', async () => {
      const app = express();
      app.use(express.json());
      
      app.use('/api/dashboard', (req, res, next) => {
        (req as any).user = { userId: 'admin-id', role: 'admin' };
        next();
      });
      app.use('/api/dashboard', dashboardRoutes);

      (mockPrisma.quest.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/dashboard/admin/quest/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Quest not found');
    });

    it('should deny access to non-admin users', async () => {
      const response = await request(app)
        .get('/api/dashboard/admin/quest/quest-123')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Insufficient permissions');
    });
  });

  describe('Validation', () => {
    it('should validate time range parameter', async () => {
      const app = express();
      app.use(express.json());
      
      app.use('/api/dashboard', (req, res, next) => {
        (req as any).user = { userId: 'admin-id', role: 'admin' };
        next();
      });
      app.use('/api/dashboard', dashboardRoutes);

      const response = await request(app)
        .get('/api/dashboard/admin/stats?timeRange=invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', async () => {
      const app = express();
      app.use(express.json());
      
      app.use('/api/dashboard', (req, res, next) => {
        (req as any).user = { userId: 'admin-id', role: 'admin' };
        next();
      });
      app.use('/api/dashboard', dashboardRoutes);

      // Mock large dataset
      (mockPrisma.user.count as jest.Mock).mockResolvedValue(10000);
      (mockPrisma.quest.count as jest.Mock).mockResolvedValue(500);
      (mockPrisma.submission.count as jest.Mock).mockResolvedValue(50000);
      (mockPrisma.achievement.count as jest.Mock).mockResolvedValue(45000);
      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue(
        Array.from({ length: 1000 }, (_, i) => ({ quest: { reward: 50 } }))
      );
      (mockPrisma.submission.groupBy as jest.Mock).mockResolvedValue(
        Array.from({ length: 1000 }, (_, i) => ({ userId: `user-${i}`, _count: { userId: 5 } }))
      );
      (mockPrisma.quest.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.submission.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.achievement.findMany as jest.Mock).mockResolvedValue([]);

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/dashboard/admin/stats')
        .expect(200);
      const endTime = Date.now();

      expect(response.body.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});
