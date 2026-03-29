import { QuestService } from '../service';
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

describe('QuestService', () => {
  let questService: QuestService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    questService = new QuestService();
    mockPrisma = (questService as any).prisma;
    jest.clearAllMocks();
  });

  describe('createQuest', () => {
    it('should create a quest successfully', async () => {
      const questData = {
        title: 'Test Quest',
        description: 'Test Description',
        reward: 100,
        difficulty: 'medium' as const,
        category: 'general',
        isActive: true,
        createdBy: 'user-id'
      };

      const mockQuest = {
        id: 'quest-id',
        ...questData,
        createdAt: new Date()
      };

      (mockPrisma.quest.create as jest.Mock).mockResolvedValue(mockQuest);

      const result = await questService.createQuest(questData);

      expect(mockPrisma.quest.create).toHaveBeenCalledWith({
        data: questData
      });
      expect(result).toEqual(mockQuest);
    });
  });

  describe('getQuestById', () => {
    it('should return quest when found', async () => {
      const mockQuest = {
        id: 'quest-id',
        title: 'Test Quest',
        description: 'Test Description',
        reward: 100,
        difficulty: 'medium' as const,
        category: 'general',
        isActive: true,
        createdAt: new Date()
      };

      (mockPrisma.quest.findUnique as jest.Mock).mockResolvedValue(mockQuest);

      const result = await questService.getQuestById('quest-id');

      expect(mockPrisma.quest.findUnique).toHaveBeenCalledWith({
        where: { id: 'quest-id' }
      });
      expect(result).toEqual(mockQuest);
    });

    it('should throw error when quest not found', async () => {
      (mockPrisma.quest.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(questService.getQuestById('nonexistent-id')).rejects.toThrow('Quest not found');
    });
  });

  describe('updateQuest', () => {
    it('should update quest successfully', async () => {
      const updateData = { title: 'Updated Quest' };
      const existingQuest = { id: 'quest-id', title: 'Old Quest' };
      const updatedQuest = {
        id: 'quest-id',
        title: 'Updated Quest',
        description: 'Test Description',
        reward: 100,
        difficulty: 'medium' as const,
        category: 'general',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (mockPrisma.quest.findUnique as jest.Mock).mockResolvedValue(existingQuest);
      (mockPrisma.quest.update as jest.Mock).mockResolvedValue(updatedQuest);

      const result = await questService.updateQuest('quest-id', updateData);

      expect(mockPrisma.quest.update).toHaveBeenCalledWith({
        where: { id: 'quest-id' },
        data: {
          ...updateData,
          updatedAt: expect.any(Date)
        }
      });
      expect(result).toEqual(updatedQuest);
    });

    it('should throw error when quest not found', async () => {
      (mockPrisma.quest.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(questService.updateQuest('nonexistent-id', {})).rejects.toThrow('Quest not found');
    });
  });

  describe('deleteQuest', () => {
    it('should delete quest successfully', async () => {
      const existingQuest = { id: 'quest-id' };

      (mockPrisma.quest.findUnique as jest.Mock).mockResolvedValue(existingQuest);
      (mockPrisma.submission.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.quest.delete as jest.Mock).mockResolvedValue({});

      await expect(questService.deleteQuest('quest-id')).resolves.not.toThrow();

      expect(mockPrisma.quest.delete).toHaveBeenCalledWith({
        where: { id: 'quest-id' }
      });
    });

    it('should throw error when quest has submissions', async () => {
      const existingQuest = { id: 'quest-id' };

      (mockPrisma.quest.findUnique as jest.Mock).mockResolvedValue(existingQuest);
      (mockPrisma.submission.count as jest.Mock).mockResolvedValue(5);

      await expect(questService.deleteQuest('quest-id')).rejects.toThrow('Cannot delete quest with existing submissions');
    });
  });

  describe('getAllQuests', () => {
    it('should return paginated quests', async () => {
      const mockQuests = [
        { id: '1', title: 'Quest 1', reward: 100 },
        { id: '2', title: 'Quest 2', reward: 200 }
      ];

      (mockPrisma.quest.findMany as jest.Mock).mockResolvedValue(mockQuests);
      (mockPrisma.quest.count as jest.Mock).mockResolvedValue(2);

      const result = await questService.getAllQuests({ page: 1, limit: 10 });

      expect(result).toEqual({
        quests: mockQuests,
        total: 2,
        page: 1,
        totalPages: 1
      });
    });

    it('should apply filters correctly', async () => {
      const filters = {
        difficulty: 'easy',
        category: 'general',
        isActive: true,
        search: 'test'
      };

      (mockPrisma.quest.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.quest.count as jest.Mock).mockResolvedValue(0);

      await questService.getAllQuests(filters);

      expect(mockPrisma.quest.findMany).toHaveBeenCalledWith({
        where: {
          difficulty: 'easy',
          category: 'general',
          isActive: true,
          OR: [
            { title: { contains: 'test', mode: 'insensitive' } },
            { description: { contains: 'test', mode: 'insensitive' } }
          ]
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe('toggleQuestStatus', () => {
    it('should toggle quest status successfully', async () => {
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

      const result = await questService.toggleQuestStatus('quest-id');

      expect(result.isActive).toBe(false);
    });
  });

  describe('getQuestStats', () => {
    it('should return quest statistics', async () => {
      const mockStats = {
        total: 10,
        active: 8,
        inactive: 2,
        byDifficulty: [
          { difficulty: 'easy', _count: { difficulty: 3 } },
          { difficulty: 'medium', _count: { difficulty: 5 } },
          { difficulty: 'hard', _count: { difficulty: 2 } }
        ],
        byCategory: [
          { category: 'general', _count: { category: 6 } },
          { category: 'special', _count: { category: 4 } }
        ]
      };

      (mockPrisma.quest.count as jest.Mock)
        .mockResolvedValueOnce(mockStats.total)
        .mockResolvedValueOnce(mockStats.active)
        .mockResolvedValueOnce(mockStats.inactive);
      (mockPrisma.quest.groupBy as jest.Mock)
        .mockResolvedValueOnce(mockStats.byDifficulty)
        .mockResolvedValueOnce(mockStats.byCategory);

      const result = await questService.getQuestStats();

      expect(result).toEqual({
        total: 10,
        active: 8,
        inactive: 2,
        byDifficulty: { easy: 3, medium: 5, hard: 2 },
        byCategory: { general: 6, special: 4 }
      });
    });
  });
});
