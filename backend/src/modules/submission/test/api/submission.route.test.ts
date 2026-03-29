import request from 'supertest';
import express from 'express';
import { submissionRoutes } from '../route';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    submission: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    quest: {
      findUnique: jest.fn(),
    },
    achievement: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    user: {
      update: jest.fn(),
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
app.use('/api/submissions', submissionRoutes);

describe('Submission API Routes', () => {
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    jest.clearAllMocks();
  });

  describe('POST /api/submissions', () => {
    it('should create a new submission', async () => {
      const submissionData = {
        questId: 'quest-id',
        content: 'This is my submission content'
      };

      const mockQuest = {
        id: 'quest-id',
        isActive: true,
        title: 'Test Quest'
      };

      const mockSubmission = {
        id: 'submission-id',
        ...submissionData,
        userId: 'user-id',
        status: 'pending',
        submittedAt: new Date(),
        user: { id: 'user-id', email: 'test@example.com', role: 'user' },
        quest: { id: 'quest-id', title: 'Test Quest', description: 'Test', reward: 100, difficulty: 'easy', category: 'general' }
      };

      (mockPrisma.quest.findUnique as jest.Mock).mockResolvedValue(mockQuest);
      (mockPrisma.submission.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.achievement.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.submission.create as jest.Mock).mockResolvedValue(mockSubmission);

      const response = await request(app)
        .post('/api/submissions')
        .send(submissionData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        message: 'Submission created successfully',
        data: mockSubmission
      });
    });

    it('should return error for invalid submission data', async () => {
      const invalidData = {
        questId: '',
        content: ''
      };

      const response = await request(app)
        .post('/api/submissions')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/submissions/my', () => {
    it('should return user submissions', async () => {
      const mockSubmissions = [
        {
          id: 'submission-id',
          userId: 'user-id',
          status: 'pending',
          user: { id: 'user-id', email: 'test@example.com', role: 'user' },
          quest: { id: 'quest-id', title: 'Test Quest', description: 'Test', reward: 100, difficulty: 'easy', category: 'general' }
        }
      ];

      (mockPrisma.submission.findMany as jest.Mock).mockResolvedValue(mockSubmissions);
      (mockPrisma.submission.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .get('/api/submissions/my')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.submissions).toEqual(mockSubmissions);
    });
  });

  describe('GET /api/submissions/:submissionId', () => {
    it('should return submission by ID for owner', async () => {
      const mockSubmission = {
        id: 'submission-id',
        userId: 'user-id',
        status: 'pending',
        user: { id: 'user-id', email: 'test@example.com', role: 'user' },
        quest: { id: 'quest-id', title: 'Test Quest', description: 'Test', reward: 100, difficulty: 'easy', category: 'general' }
      };

      (mockPrisma.submission.findUnique as jest.Mock).mockResolvedValue(mockSubmission);

      const response = await request(app)
        .get('/api/submissions/submission-id')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSubmission);
    });

    it('should deny access to other users submissions', async () => {
      const mockSubmission = {
        id: 'submission-id',
        userId: 'other-user-id',
        status: 'pending',
        user: { id: 'other-user-id', email: 'other@example.com', role: 'user' },
        quest: { id: 'quest-id', title: 'Test Quest' }
      };

      (mockPrisma.submission.findUnique as jest.Mock).mockResolvedValue(mockSubmission);

      const response = await request(app)
        .get('/api/submissions/submission-id')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied');
    });
  });

  describe('PUT /api/submissions/:submissionId', () => {
    it('should update submission', async () => {
      const updateData = {
        content: 'Updated submission content'
      };

      const existingSubmission = {
        id: 'submission-id',
        userId: 'user-id',
        status: 'pending'
      };

      const updatedSubmission = {
        id: 'submission-id',
        ...existingSubmission,
        ...updateData,
        user: { id: 'user-id', email: 'test@example.com', role: 'user' },
        quest: { id: 'quest-id', title: 'Test Quest', description: 'Test', reward: 100, difficulty: 'easy', category: 'general' }
      };

      (mockPrisma.submission.findUnique as jest.Mock).mockResolvedValue(existingSubmission);
      (mockPrisma.submission.update as jest.Mock).mockResolvedValue(updatedSubmission);

      const response = await request(app)
        .put('/api/submissions/submission-id')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Submission updated successfully',
        data: updatedSubmission
      });
    });
  });

  describe('DELETE /api/submissions/:submissionId', () => {
    it('should delete own pending submission', async () => {
      const existingSubmission = {
        id: 'submission-id',
        userId: 'user-id',
        status: 'pending'
      };

      (mockPrisma.submission.findUnique as jest.Mock).mockResolvedValue(existingSubmission);
      (mockPrisma.submission.delete as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .delete('/api/submissions/submission-id')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Submission deleted successfully'
      });
    });
  });

  describe('PATCH /api/submissions/:submissionId/approve', () => {
    it('should approve submission (admin only)', async () => {
      // Mock admin user for this test
      const app = express();
      app.use(express.json());
      
      app.use('/api/submissions', (req, res, next) => {
        (req as any).user = { userId: 'admin-id', role: 'admin' };
        next();
      });
      app.use('/api/submissions', submissionRoutes);

      const existingSubmission = {
        id: 'submission-id',
        userId: 'user-id',
        questId: 'quest-id',
        status: 'pending'
      };

      const mockQuest = {
        id: 'quest-id',
        reward: 100
      };

      const approvedSubmission = {
        id: 'submission-id',
        ...existingSubmission,
        status: 'approved',
        feedback: 'Great work!',
        user: { id: 'user-id', email: 'test@example.com', role: 'user' },
        quest: { id: 'quest-id', title: 'Test Quest', description: 'Test', reward: 100, difficulty: 'easy', category: 'general' }
      };

      (mockPrisma.submission.findUnique as jest.Mock).mockResolvedValue(existingSubmission);
      (mockPrisma.quest.findUnique as jest.Mock).mockResolvedValue(mockQuest);
      (mockPrisma.achievement.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});
      (mockPrisma.submission.update as jest.Mock).mockResolvedValue(approvedSubmission);

      const response = await request(app)
        .patch('/api/submissions/submission-id/approve')
        .send({ feedback: 'Great work!' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Submission approved successfully',
        data: approvedSubmission
      });
    });

    it('should deny access to non-admin users', async () => {
      const response = await request(app)
        .patch('/api/submissions/submission-id/approve')
        .send({ feedback: 'Good work' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/submissions/:submissionId/reject', () => {
    it('should reject submission (admin only)', async () => {
      // Mock admin user for this test
      const app = express();
      app.use(express.json());
      
      app.use('/api/submissions', (req, res, next) => {
        (req as any).user = { userId: 'admin-id', role: 'admin' };
        next();
      });
      app.use('/api/submissions', submissionRoutes);

      const existingSubmission = {
        id: 'submission-id',
        userId: 'user-id',
        status: 'pending'
      };

      const rejectedSubmission = {
        id: 'submission-id',
        ...existingSubmission,
        status: 'rejected',
        feedback: 'Needs improvement',
        user: { id: 'user-id', email: 'test@example.com', role: 'user' },
        quest: { id: 'quest-id', title: 'Test Quest', description: 'Test', reward: 100, difficulty: 'easy', category: 'general' }
      };

      (mockPrisma.submission.findUnique as jest.Mock).mockResolvedValue(existingSubmission);
      (mockPrisma.submission.update as jest.Mock).mockResolvedValue(rejectedSubmission);

      const response = await request(app)
        .patch('/api/submissions/submission-id/reject')
        .send({ feedback: 'Needs improvement' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Submission rejected successfully',
        data: rejectedSubmission
      });
    });
  });

  describe('GET /api/submissions/admin/all', () => {
    it('should return all submissions (admin only)', async () => {
      // Mock admin user for this test
      const app = express();
      app.use(express.json());
      
      app.use('/api/submissions', (req, res, next) => {
        (req as any).user = { userId: 'admin-id', role: 'admin' };
        next();
      });
      app.use('/api/submissions', submissionRoutes);

      const mockSubmissions = [
        {
          id: 'submission-1',
          userId: 'user-1',
          status: 'pending',
          user: { id: 'user-1', email: 'user1@example.com', role: 'user' },
          quest: { id: 'quest-1', title: 'Quest 1', description: 'Test', reward: 100, difficulty: 'easy', category: 'general' }
        }
      ];

      (mockPrisma.submission.findMany as jest.Mock).mockResolvedValue(mockSubmissions);
      (mockPrisma.submission.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .get('/api/submissions/admin/all')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.submissions).toEqual(mockSubmissions);
    });
  });

  describe('GET /api/submissions/admin/stats', () => {
    it('should return submission statistics (admin only)', async () => {
      // Mock admin user for this test
      const app = express();
      app.use(express.json());
      
      app.use('/api/submissions', (req, res, next) => {
        (req as any).user = { userId: 'admin-id', role: 'admin' };
        next();
      });
      app.use('/api/submissions', submissionRoutes);

      const mockStats = {
        total: 10,
        pending: 3,
        approved: 6,
        rejected: 1,
        byQuest: [
          { questId: 'quest1', _count: { questId: 5 } }
        ],
        byUser: [
          { userId: 'user1', _count: { userId: 4 } }
        ]
      };

      (mockPrisma.submission.count as jest.Mock)
        .mockResolvedValueOnce(mockStats.total)
        .mockResolvedValueOnce(mockStats.pending)
        .mockResolvedValueOnce(mockStats.approved)
        .mockResolvedValueOnce(mockStats.rejected);
      (mockPrisma.submission.groupBy as jest.Mock)
        .mockResolvedValueOnce(mockStats.byQuest)
        .mockResolvedValueOnce(mockStats.byUser);

      const response = await request(app)
        .get('/api/submissions/admin/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        total: 10,
        pending: 3,
        approved: 6,
        rejected: 1,
        byQuest: { quest1: 5 },
        byUser: { user1: 4 }
      });
    });
  });
});
