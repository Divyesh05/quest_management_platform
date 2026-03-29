import request from 'supertest';
import express from 'express';
import { rewardRoutes } from '../route';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    reward: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      findFirst: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    quest: {
      findUnique: jest.fn(),
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
app.use('/api/rewards', rewardRoutes);

describe('Reward API Routes', () => {
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    jest.clearAllMocks();
  });

  describe('POST /api/rewards', () => {
    it('should create a reward (admin only)', async () => {
      // Mock admin user for this test
      const app = express();
      app.use(express.json());
      
      app.use('/api/rewards', (req, res, next) => {
        (req as any).user = { userId: 'admin-id', role: 'admin' };
        next();
      });
      app.use('/api/rewards', rewardRoutes);

      const rewardData = {
        userId: 'user-id',
        type: 'bonus',
        points: 50,
        description: 'Bonus reward for great work'
      };

      const mockUser = { id: 'user-id', email: 'test@example.com' };
      const mockReward = {
        id: 'reward-id',
        ...rewardData,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: 'user-id', email: 'test@example.com', role: 'user', points: 150 },
        quest: null
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.reward.create as jest.Mock).mockResolvedValue(mockReward);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .post('/api/rewards')
        .send(rewardData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        message: 'Reward created successfully',
        data: mockReward
      });
    });

    it('should deny access to non-admin users', async () => {
      const rewardData = {
        userId: 'user-id',
        type: 'bonus',
        points: 50,
        description: 'Bonus reward'
      };

      const response = await request(app)
        .post('/api/rewards')
        .send(rewardData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/rewards/my', () => {
    it('should return user rewards', async () => {
      const mockRewards = [
        {
          id: 'reward-1',
          userId: 'user-id',
          type: 'bonus',
          points: 50,
          user: { id: 'user-id', email: 'test@example.com', role: 'user', points: 150 },
          quest: null
        }
      ];

      (mockPrisma.reward.findMany as jest.Mock).mockResolvedValue(mockRewards);
      (mockPrisma.reward.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .get('/api/rewards/my')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rewards).toEqual(mockRewards);
    });
  });

  describe('GET /api/rewards/:rewardId', () => {
    it('should return reward by ID for owner', async () => {
      const mockReward = {
        id: 'reward-id',
        userId: 'user-id',
        type: 'bonus',
        points: 50,
        user: { id: 'user-id', email: 'test@example.com', role: 'user', points: 150 },
        quest: null
      };

      (mockPrisma.reward.findUnique as jest.Mock).mockResolvedValue(mockReward);

      const response = await request(app)
        .get('/api/rewards/reward-id')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockReward);
    });

    it('should deny access to other users rewards', async () => {
      const mockReward = {
        id: 'reward-id',
        userId: 'other-user-id',
        user: { id: 'other-user-id', email: 'other@example.com', role: 'user' },
        quest: null
      };

      (mockPrisma.reward.findUnique as jest.Mock).mockResolvedValue(mockReward);

      const response = await request(app)
        .get('/api/rewards/reward-id')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied');
    });
  });

  describe('PUT /api/rewards/:rewardId', () => {
    it('should update reward (admin only)', async () => {
      const app = express();
      app.use(express.json());
      
      app.use('/api/rewards', (req, res, next) => {
        (req as any).user = { userId: 'admin-id', role: 'admin' };
        next();
      });
      app.use('/api/rewards', rewardRoutes);

      const updateData = {
        points: 75,
        description: 'Updated reward description'
      };

      const existingReward = {
        id: 'reward-id',
        userId: 'user-id',
        points: 50
      };

      const updatedReward = {
        id: 'reward-id',
        ...existingReward,
        ...updateData,
        updatedAt: new Date(),
        user: { id: 'user-id', email: 'test@example.com', role: 'user', points: 175 },
        quest: null
      };

      (mockPrisma.reward.findUnique as jest.Mock).mockResolvedValue(existingReward);
      (mockPrisma.reward.update as jest.Mock).mockResolvedValue(updatedReward);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .put('/api/rewards/reward-id')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Reward updated successfully',
        data: updatedReward
      });
    });

    it('should deny access to non-admin users', async () => {
      const response = await request(app)
        .put('/api/rewards/reward-id')
        .send({ points: 75 })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/rewards/:rewardId', () => {
    it('should delete reward (admin only)', async () => {
      const app = express();
      app.use(express.json());
      
      app.use('/api/rewards', (req, res, next) => {
        (req as any).user = { userId: 'admin-id', role: 'admin' };
        next();
      });
      app.use('/api/rewards', rewardRoutes);

      const mockReward = {
        id: 'reward-id',
        userId: 'user-id',
        points: 50
      };

      (mockPrisma.reward.findUnique as jest.Mock).mockResolvedValue(mockReward);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});
      (mockPrisma.reward.delete as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .delete('/api/rewards/reward-id')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Reward deleted successfully'
      });
    });
  });

  describe('GET /api/rewards/admin/all', () => {
    it('should return all rewards (admin only)', async () => {
      const app = express();
      app.use(express.json());
      
      app.use('/api/rewards', (req, res, next) => {
        (req as any).user = { userId: 'admin-id', role: 'admin' };
        next();
      });
      app.use('/api/rewards', rewardRoutes);

      const mockRewards = [
        {
          id: 'reward-1',
          userId: 'user-1',
          type: 'bonus',
          points: 50,
          user: { id: 'user-1', email: 'user1@example.com', role: 'user', points: 150 },
          quest: null
        }
      ];

      (mockPrisma.reward.findMany as jest.Mock).mockResolvedValue(mockRewards);
      (mockPrisma.reward.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .get('/api/rewards/admin/all')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rewards).toEqual(mockRewards);
    });
  });

  describe('GET /api/rewards/admin/stats', () => {
    it('should return reward statistics (admin only)', async () => {
      const app = express();
      app.use(express.json());
      
      app.use('/api/rewards', (req, res, next) => {
        (req as any).user = { userId: 'admin-id', role: 'admin' };
        next();
      });
      app.use('/api/rewards', rewardRoutes);

      (mockPrisma.reward.count as jest.Mock).mockResolvedValue(2);
      (mockPrisma.reward.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.reward.groupBy as jest.Mock).mockResolvedValue([]);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.quest.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.reward.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/rewards/admin/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalRewards).toBe(2);
    });
  });

  describe('POST /api/rewards/award/quest/:userId/:questId', () => {
    it('should award quest reward (admin only)', async () => {
      const app = express();
      app.use(express.json());
      
      app.use('/api/rewards', (req, res, next) => {
        (req as any).user = { userId: 'admin-id', role: 'admin' };
        next();
      });
      app.use('/api/rewards', rewardRoutes);

      const mockQuest = {
        id: 'quest-id',
        title: 'Test Quest',
        reward: 50
      };

      const mockReward = {
        id: 'reward-id',
        userId: 'user-id',
        questId: 'quest-id',
        type: 'quest_completion',
        points: 50,
        description: 'Completed quest: Test Quest'
      };

      (mockPrisma.reward.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.quest.findUnique as jest.Mock).mockResolvedValue(mockQuest);
      (mockPrisma.reward.create as jest.Mock).mockResolvedValue(mockReward);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .post('/api/rewards/award/quest/user-id/quest-id')
        .send({ bonusPoints: 10 })
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        message: 'Quest reward awarded successfully',
        data: mockReward
      });
    });
  });

  describe('POST /api/rewards/award/bonus/:userId', () => {
    it('should award bonus reward (admin only)', async () => {
      const app = express();
      app.use(express.json());
      
      app.use('/api/rewards', (req, res, next) => {
        (req as any).user = { userId: 'admin-id', role: 'admin' };
        next();
      });
      app.use('/api/rewards', rewardRoutes);

      const rewardData = {
        points: 50,
        description: 'Great work this week!'
      };

      const mockReward = {
        id: 'reward-id',
        userId: 'user-id',
        type: 'bonus',
        points: 50,
        description: 'Great work this week!'
      };

      (mockPrisma.reward.create as jest.Mock).mockResolvedValue(mockReward);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .post('/api/rewards/award/bonus/user-id')
        .send(rewardData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        message: 'Bonus reward awarded successfully',
        data: mockReward
      });
    });
  });

  describe('POST /api/rewards/award/streak/:userId', () => {
    it('should award streak reward (admin only)', async () => {
      const app = express();
      app.use(express.json());
      
      app.use('/api/rewards', (req, res, next) => {
        (req as any).user = { userId: 'admin-id', role: 'admin' };
        next();
      });
      app.use('/api/rewards', rewardRoutes);

      const streakData = {
        streakCount: 7,
        points: 25
      };

      const mockReward = {
        id: 'reward-id',
        userId: 'user-id',
        type: 'streak',
        points: 25,
        description: '7-day streak bonus'
      };

      (mockPrisma.reward.create as jest.Mock).mockResolvedValue(mockReward);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .post('/api/rewards/award/streak/user-id')
        .send(streakData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        message: 'Streak reward awarded successfully',
        data: mockReward
      });
    });
  });

  describe('Validation', () => {
    it('should validate reward creation data', async () => {
      const app = express();
      app.use(express.json());
      
      app.use('/api/rewards', (req, res, next) => {
        (req as any).user = { userId: 'admin-id', role: 'admin' };
        next();
      });
      app.use('/api/rewards', rewardRoutes);

      const invalidData = {
        userId: '',
        type: 'invalid',
        points: -10,
        description: ''
      };

      const response = await request(app)
        .post('/api/rewards')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
