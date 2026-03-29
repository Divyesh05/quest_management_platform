import { UserService } from '../service';
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

describe('UserService', () => {
  let userService: UserService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    userService = new UserService();
    mockPrisma = (userService as any).prisma;
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        role: 'user',
        points: 100,
        createdAt: new Date(),
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.getUserById('user-id');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        select: {
          id: true,
          email: true,
          role: true,
          points: true,
          createdAt: true,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw error when user not found', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(userService.getUserById('nonexistent-id')).rejects.toThrow('User not found');
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
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

      const result = await userService.updateUser('user-id', updateData);

      expect(result).toEqual(updatedUser);
    });

    it('should throw error when user not found', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(userService.updateUser('nonexistent-id', {})).rejects.toThrow('User not found');
    });

    it('should throw error when email already taken', async () => {
      const existingUser = { id: 'user-id', email: 'old@example.com' };
      const anotherUser = { id: 'other-id', email: 'newemail@example.com' };

      (mockPrisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(anotherUser);

      await expect(userService.updateUser('user-id', { email: 'newemail@example.com' }))
        .rejects.toThrow('Email already taken');
    });
  });

  describe('addPoints', () => {
    it('should add points to user successfully', async () => {
      const updatedUser = {
        id: 'user-id',
        email: 'test@example.com',
        role: 'user',
        points: 150,
        createdAt: new Date(),
      };

      (mockPrisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await userService.addPoints('user-id', 50);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: {
          points: { increment: 50 },
          updatedAt: expect.any(Date),
        },
        select: {
          id: true,
          email: true,
          role: true,
          points: true,
          createdAt: true,
        },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should throw error for invalid points amount', async () => {
      await expect(userService.addPoints('user-id', 0)).rejects.toThrow('Points must be greater than 0');
      await expect(userService.addPoints('user-id', -10)).rejects.toThrow('Points must be greater than 0');
    });
  });

  describe('deductPoints', () => {
    it('should deduct points from user successfully', async () => {
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

      const result = await userService.deductPoints('user-id', 50);

      expect(result).toEqual(updatedUser);
    });

    it('should throw error for insufficient points', async () => {
      const userWithPoints = { points: 30 };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(userWithPoints);

      await expect(userService.deductPoints('user-id', 50)).rejects.toThrow('Insufficient points');
    });

    it('should throw error for invalid points amount', async () => {
      await expect(userService.deductPoints('user-id', 0)).rejects.toThrow('Points must be greater than 0');
    });
  });

  describe('getAllUsers', () => {
    it('should return paginated users', async () => {
      const mockUsers = [
        { id: '1', email: 'user1@example.com', role: 'user', points: 100, createdAt: new Date() },
        { id: '2', email: 'user2@example.com', role: 'user', points: 200, createdAt: new Date() },
      ];

      (mockPrisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (mockPrisma.user.count as jest.Mock).mockResolvedValue(2);

      const result = await userService.getAllUsers(1, 10);

      expect(result).toEqual({
        users: mockUsers,
        total: 2,
        page: 1,
        totalPages: 1,
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const existingUser = { id: 'user-id' };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);
      (mockPrisma.user.delete as jest.Mock).mockResolvedValue({});

      await expect(userService.deleteUser('user-id')).resolves.not.toThrow();

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-id' },
      });
    });

    it('should throw error when user not found', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(userService.deleteUser('nonexistent-id')).rejects.toThrow('User not found');
    });
  });
});
