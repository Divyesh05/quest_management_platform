import request from 'supertest';
import express from 'express';
import { userRoutes } from '../route';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
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
app.use('/api/users', userRoutes);

describe('User API Routes', () => {
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    jest.clearAllMocks();
  });

  describe('GET /api/users/profile', () => {
    it('should return user profile', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        role: 'user',
        points: 100,
        createdAt: new Date(),
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/users/profile')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockUser,
      });
    });

    it('should return error for user not found', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/users/profile')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile', async () => {
      const updateData = { email: 'newemail@example.com' };
      const existingUser = { id: 'user-id', email: 'old@example.com' };
      const updatedUser = {
        id: 'user-id',
        email: 'newemail@example.com',
        role: 'user',
        points: 100,
        createdAt: new Date(),
      };

      (mockPrisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(null);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/api/users/profile')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser,
      });
    });

    it('should return error for invalid email', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/users/:userId/points/add', () => {
    it('should add points to user (admin only)', async () => {
      // Mock admin user for this test
      const app = express();
      app.use(express.json());
      
      // Override middleware for admin test
      app.use('/api/users', (req, res, next) => {
        (req as any).user = { userId: 'admin-id', role: 'admin' };
        next();
      });
      app.use('/api/users', userRoutes);

      const updatedUser = {
        id: 'user-id',
        email: 'test@example.com',
        role: 'user',
        points: 150,
        createdAt: new Date(),
      };

      (mockPrisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const response = await request(app)
        .post('/api/users/user-id/points/add')
        .send({ points: 50 })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Added 50 points to user',
        data: updatedUser,
      });
    });

    it('should return error for invalid points amount', async () => {
      const response = await request(app)
        .post('/api/users/user-id/points/add')
        .send({ points: -10 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/users/:userId/points/deduct', () => {
    it('should deduct points from user (admin only)', async () => {
      // Mock admin user for this test
      const app = express();
      app.use(express.json());
      
      app.use('/api/users', (req, res, next) => {
        (req as any).user = { userId: 'admin-id', role: 'admin' };
        next();
      });
      app.use('/api/users', userRoutes);

      const userWithPoints = { points: 100 };
      const updatedUser = {
        id: 'user-id',
        email: 'test@example.com',
        role: 'user',
        points: 50,
        createdAt: new Date(),
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(userWithPoints);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const response = await request(app)
        .post('/api/users/user-id/points/deduct')
        .send({ points: 50 })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Deducted 50 points from user',
        data: updatedUser,
      });
    });
  });

  describe('GET /api/users/all', () => {
    it('should return all users (admin only)', async () => {
      // Mock admin user for this test
      const app = express();
      app.use(express.json());
      
      app.use('/api/users', (req, res, next) => {
        (req as any).user = { userId: 'admin-id', role: 'admin' };
        next();
      });
      app.use('/api/users', userRoutes);

      const mockUsers = [
        { id: '1', email: 'user1@example.com', role: 'user', points: 100, createdAt: new Date() },
      ];

      (mockPrisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (mockPrisma.user.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .get('/api/users/all')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          users: mockUsers,
          total: 1,
          page: 1,
          totalPages: 1,
        },
      });
    });
  });

  describe('Authorization', () => {
    it('should deny access to non-admin users for admin routes', async () => {
      // Mock regular user
      const app = express();
      app.use(express.json());
      
      app.use('/api/users', (req, res, next) => {
        (req as any).user = { userId: 'user-id', role: 'user' };
        next();
      });
      app.use('/api/users', userRoutes);

      const response = await request(app)
        .get('/api/users/all')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Insufficient permissions');
    });
  });
});
