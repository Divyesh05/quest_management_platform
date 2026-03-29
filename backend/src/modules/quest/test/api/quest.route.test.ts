import request from 'supertest';
import express from 'express';
import { questRoutes } from '../route';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    quest: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    submission: {
      count: jest.fn(),
    },
  })),
}));

// Mock auth middleware
jest.mock('../auth/middleware', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { userId: 'admin-id', role: 'admin' };
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
app.use('/api/quests', questRoutes);

describe('Quest API Routes', () => {
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    jest.clearAllMocks();
  });

  describe('GET /api/quests', () => {
    it('should return all quests with filters', async () => {
      const mockQuests = [
        { id: '1', title: 'Quest 1', reward: 100, difficulty: 'easy' },
        { id: '2', title: 'Quest 2', reward: 200, difficulty: 'medium' }
      ];

      (mockPrisma.quest.findMany as jest.Mock).mockResolvedValue(mockQuests);
      (mockPrisma.quest.count as jest.Mock).mockResolvedValue(2);

      const response = await request(app)
        .get('/api/quests?difficulty=easy&page=1&limit=10')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          quests: mockQuests,
          total: 2,
          page: 1,
          totalPages: 1
        }
      });
    });
  });

  describe('GET /api/quests/active', () => {
    it('should return active quests', async () => {
      const mockQuests = [
        { id: '1', title: 'Active Quest', isActive: true }
      ];

      (mockPrisma.quest.findMany as jest.Mock).mockResolvedValue(mockQuests);
      (mockPrisma.quest.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .get('/api/quests/active')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.quests).toEqual(mockQuests);
    });
  });

  describe('GET /api/quests/category/:category', () => {
    it('should return quests by category', async () => {
      const mockQuests = [
        { id: '1', title: 'General Quest', category: 'general' }
      ];

      (mockPrisma.quest.findMany as jest.Mock).mockResolvedValue(mockQuests);
      (mockPrisma.quest.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .get('/api/quests/category/general')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/quests/difficulty/:difficulty', () => {
    it('should return quests by difficulty', async () => {
      const mockQuests = [
        { id: '1', title: 'Easy Quest', difficulty: 'easy' }
      ];

      (mockPrisma.quest.findMany as jest.Mock).mockResolvedValue(mockQuests);
      (mockPrisma.quest.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .get('/api/quests/difficulty/easy')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/quests/:questId', () => {
    it('should return quest by ID', async () => {
      const mockQuest = {
        id: 'quest-id',
        title: 'Test Quest',
        description: 'Test Description',
        reward: 100
      };

      (mockPrisma.quest.findUnique as jest.Mock).mockResolvedValue(mockQuest);

      const response = await request(app)
        .get('/api/quests/quest-id')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockQuest
      });
    });

    it('should return error for non-existent quest', async () => {
      (mockPrisma.quest.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/quests/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/quests', () => {
    it('should create a new quest (admin only)', async () => {
      const questData = {
        title: 'New Quest',
        description: 'New Description',
        reward: 100,
        difficulty: 'medium',
        category: 'general'
      };

      const mockQuest = {
        id: 'new-quest-id',
        ...questData,
        isActive: true,
        createdAt: new Date()
      };

      (mockPrisma.quest.create as jest.Mock).mockResolvedValue(mockQuest);

      const response = await request(app)
        .post('/api/quests')
        .send(questData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        message: 'Quest created successfully',
        data: mockQuest
      });
    });

    it('should return error for invalid quest data', async () => {
      const invalidData = {
        title: '',
        description: 'Test',
        reward: -10
      };

      const response = await request(app)
        .post('/api/quests')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/quests/:questId', () => {
    it('should update quest (admin only)', async () => {
      const updateData = {
        title: 'Updated Quest',
        reward: 150
      };

      const existingQuest = { id: 'quest-id' };
      const updatedQuest = {
        id: 'quest-id',
        title: 'Updated Quest',
        reward: 150,
        description: 'Original Description'
      };

      (mockPrisma.quest.findUnique as jest.Mock).mockResolvedValue(existingQuest);
      (mockPrisma.quest.update as jest.Mock).mockResolvedValue(updatedQuest);

      const response = await request(app)
        .put('/api/quests/quest-id')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Quest updated successfully',
        data: updatedQuest
      });
    });
  });

  describe('DELETE /api/quests/:questId', () => {
    it('should delete quest (admin only)', async () => {
      const existingQuest = { id: 'quest-id' };

      (mockPrisma.quest.findUnique as jest.Mock).mockResolvedValue(existingQuest);
      (mockPrisma.submission.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.quest.delete as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .delete('/api/quests/quest-id')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Quest deleted successfully'
      });
    });

    it('should return error when quest has submissions', async () => {
      const existingQuest = { id: 'quest-id' };

      (mockPrisma.quest.findUnique as jest.Mock).mockResolvedValue(existingQuest);
      (mockPrisma.submission.count as jest.Mock).mockResolvedValue(5);

      const response = await request(app)
        .delete('/api/quests/quest-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Cannot delete quest with existing submissions');
    });
  });

  describe('PATCH /api/quests/:questId/toggle', () => {
    it('should toggle quest status (admin only)', async () => {
      const mockQuest = {
        id: 'quest-id',
        isActive: true,
        title: 'Test Quest'
      };

      (mockPrisma.quest.findUnique as jest.Mock).mockResolvedValue(mockQuest);
      (mockPrisma.quest.update as jest.Mock).mockResolvedValue({
        ...mockQuest,
        isActive: false
      });

      const response = await request(app)
        .patch('/api/quests/quest-id/toggle')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Quest deactivated successfully',
        data: { ...mockQuest, isActive: false }
      });
    });
  });

  describe('GET /api/quests/admin/stats', () => {
    it('should return quest statistics (admin only)', async () => {
      const mockStats = {
        total: 10,
        active: 8,
        inactive: 2,
        byDifficulty: [
          { difficulty: 'easy', _count: { difficulty: 3 } }
        ],
        byCategory: [
          { category: 'general', _count: { category: 6 } }
        ]
      };

      (mockPrisma.quest.count as jest.Mock)
        .mockResolvedValueOnce(mockStats.total)
        .mockResolvedValueOnce(mockStats.active)
        .mockResolvedValueOnce(mockStats.inactive);
      (mockPrisma.quest.groupBy as jest.Mock)
        .mockResolvedValueOnce(mockStats.byDifficulty)
        .mockResolvedValueOnce(mockStats.byCategory);

      const response = await request(app)
        .get('/api/quests/admin/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        total: 10,
        active: 8,
        inactive: 2,
        byDifficulty: { easy: 3 },
        byCategory: { general: 6 }
      });
    });
  });
});
