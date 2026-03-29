import { RewardService } from '../service';
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

describe('RewardService', () => {
  let rewardService: RewardService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    rewardService = new RewardService();
    mockPrisma = (rewardService as any).prisma;
    jest.clearAllMocks();
  });

  describe('createReward', () => {
    it('should create a reward successfully', async () => {
      const rewardData = {
        userId: 'user-id',
        questId: 'quest-id',
        type: 'quest_completion' as const,
        points: 100,
        description: 'Completed quest'
      };

      const mockUser = { id: 'user-id', email: 'test@example.com' };
      const mockQuest = { id: 'quest-id', title: 'Test Quest' };

      const mockReward = {
        id: 'reward-id',
        ...rewardData,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: 'user-id', email: 'test@example.com', role: 'user', points: 100 },
        quest: { id: 'quest-id', title: 'Test Quest', description: 'Test', reward: 50, difficulty: 'easy', category: 'general' }
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.quest.findUnique as jest.Mock).mockResolvedValue(mockQuest);
      (mockPrisma.reward.create as jest.Mock).mockResolvedValue(mockReward);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});

      const result = await rewardService.createReward(rewardData);

      expect(mockPrisma.reward.create).toHaveBeenCalledWith({
        data: {
          userId: rewardData.userId,
          questId: rewardData.questId,
          type: rewardData.type,
          points: rewardData.points,
          description: rewardData.description,
          metadata: rewardData.metadata
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              points: true
            }
          },
          quest: {
            select: {
              id: true,
              title: true,
              description: true,
              reward: true,
              difficulty: true,
              category: true
            }
          }
        }
      });
      expect(result).toEqual(mockReward);
    });

    it('should throw error if user not found', async () => {
      const rewardData = {
        userId: 'nonexistent-user',
        type: 'bonus' as const,
        points: 50,
        description: 'Bonus reward'
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(rewardService.createReward(rewardData)).rejects.toThrow('User not found');
    });

    it('should throw error if quest not found', async () => {
      const rewardData = {
        userId: 'user-id',
        questId: 'nonexistent-quest',
        type: 'quest_completion' as const,
        points: 100,
        description: 'Completed quest'
      };

      const mockUser = { id: 'user-id', email: 'test@example.com' };
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.quest.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(rewardService.createReward(rewardData)).rejects.toThrow('Quest not found');
    });
  });

  describe('getRewardById', () => {
    it('should return reward by ID', async () => {
      const mockReward = {
        id: 'reward-id',
        userId: 'user-id',
        type: 'bonus',
        points: 50,
        description: 'Bonus reward',
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: 'user-id', email: 'test@example.com', role: 'user', points: 150 },
        quest: null
      };

      (mockPrisma.reward.findUnique as jest.Mock).mockResolvedValue(mockReward);

      const result = await rewardService.getRewardById('reward-id');

      expect(result).toEqual(mockReward);
    });

    it('should throw error if reward not found', async () => {
      (mockPrisma.reward.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(rewardService.getRewardById('nonexistent-id')).rejects.toThrow('Reward not found');
    });
  });

  describe('updateReward', () => {
    it('should update reward successfully', async () => {
      const updateData = {
        points: 150,
        description: 'Updated reward description'
      };

      const existingReward = {
        id: 'reward-id',
        userId: 'user-id',
        points: 100
      };

      const updatedReward = {
        id: 'reward-id',
        ...existingReward,
        ...updateData,
        updatedAt: new Date(),
        user: { id: 'user-id', email: 'test@example.com', role: 'user', points: 200 },
        quest: null
      };

      (mockPrisma.reward.findUnique as jest.Mock).mockResolvedValue(existingReward);
      (mockPrisma.reward.update as jest.Mock).mockResolvedValue(updatedReward);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});

      const result = await rewardService.updateReward('reward-id', updateData);

      expect(result).toEqual(updatedReward);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: {
          points: {
            increment: 50
          }
        }
      });
    });

    it('should throw error if reward not found', async () => {
      (mockPrisma.reward.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(rewardService.updateReward('nonexistent-id', {})).rejects.toThrow('Reward not found');
    });
  });

  describe('deleteReward', () => {
    it('should delete reward and deduct points', async () => {
      const mockReward = {
        id: 'reward-id',
        userId: 'user-id',
        points: 100
      };

      (mockPrisma.reward.findUnique as jest.Mock).mockResolvedValue(mockReward);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});
      (mockPrisma.reward.delete as jest.Mock).mockResolvedValue({});

      await expect(rewardService.deleteReward('reward-id')).resolves.not.toThrow();

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: {
          points: {
            decrement: 100
          }
        }
      });
      expect(mockPrisma.reward.delete).toHaveBeenCalledWith({
        where: { id: 'reward-id' }
      });
    });

    it('should throw error if reward not found', async () => {
      (mockPrisma.reward.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(rewardService.deleteReward('nonexistent-id')).rejects.toThrow('Reward not found');
    });
  });

  describe('getUserRewards', () => {
    it('should return user rewards with pagination', async () => {
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

      const result = await rewardService.getUserRewards('user-id', { page: 1, limit: 10 });

      expect(result).toEqual({
        rewards: mockRewards,
        total: 1,
        page: 1,
        totalPages: 1
      });
    });

    it('should apply filters', async () => {
      (mockPrisma.reward.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.reward.count as jest.Mock).mockResolvedValue(0);

      await rewardService.getUserRewards('user-id', { type: 'bonus', questId: 'quest-id' });

      expect(mockPrisma.reward.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user-id',
            type: 'bonus',
            questId: 'quest-id'
          }
        })
      );
    });
  });

  describe('awardQuestReward', () => {
    it('should award quest reward successfully', async () => {
      const userId = 'user-id';
      const questId = 'quest-id';
      const bonusPoints = 25;

      const mockQuest = {
        id: questId,
        title: 'Test Quest',
        reward: 50
      };

      const mockReward = {
        id: 'reward-id',
        userId,
        questId,
        type: 'quest_completion',
        points: 75,
        description: 'Completed quest: Test Quest (with 25 bonus points)'
      };

      (mockPrisma.reward.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.quest.findUnique as jest.Mock).mockResolvedValue(mockQuest);
      (mockPrisma.reward.create as jest.Mock).mockResolvedValue(mockReward);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});

      const result = await rewardService.awardQuestReward(userId, questId, bonusPoints);

      expect(result.type).toBe('quest_completion');
      expect(result.points).toBe(75); // 50 + 25 bonus
    });

    it('should throw error if user already has reward for quest', async () => {
      const existingReward = { id: 'existing-reward' };
      (mockPrisma.reward.findFirst as jest.Mock).mockResolvedValue(existingReward);

      await expect(rewardService.awardQuestReward('user-id', 'quest-id')).rejects.toThrow('User already received reward for this quest');
    });
  });

  describe('getRewardStats', () => {
    it('should return reward statistics', async () => {
      const mockRewards = [
        { type: 'bonus', points: 50 },
        { type: 'quest_completion', points: 100 }
      ];

      const mockRewardsByType = [
        { type: 'bonus', _count: { type: 1 } },
        { type: 'quest_completion', _count: { type: 1 } }
      ];

      (mockPrisma.reward.count as jest.Mock).mockResolvedValue(2);
      (mockPrisma.reward.findMany as jest.Mock).mockResolvedValue(mockRewards);
      (mockPrisma.reward.groupBy as jest.Mock)
        .mockResolvedValueOnce(mockRewardsByType)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.quest.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await rewardService.getRewardStats();

      expect(result).toEqual({
        totalRewards: 2,
        totalPointsAwarded: 150,
        rewardsByType: { bonus: 1, quest_completion: 1 },
        rewardsByUser: [],
        rewardsByQuest: [],
        recentRewards: []
      });
    });

    it('should apply time range filter', async () => {
      const dateFilter = { gte: expect.any(Date) };

      (mockPrisma.reward.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.reward.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.reward.groupBy as jest.Mock).mockResolvedValue([]);
      (mockPrisma.reward.findMany as jest.Mock).mockResolvedValue([]);

      await rewardService.getRewardStats('week');

      expect(mockPrisma.reward.count).toHaveBeenCalledWith({
        where: { createdAt: dateFilter }
      });
    });
  });
});
