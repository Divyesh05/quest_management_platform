import { SubmissionService } from '../service';
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

describe('SubmissionService', () => {
  let submissionService: SubmissionService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    submissionService = new SubmissionService();
    mockPrisma = (submissionService as any).prisma;
    jest.clearAllMocks();
  });

  describe('createSubmission', () => {
    it('should create a submission successfully', async () => {
      const submissionData = {
        questId: 'quest-id',
        content: 'Test submission content',
        userId: 'user-id'
      };

      const mockQuest = {
        id: 'quest-id',
        isActive: true,
        title: 'Test Quest'
      };

      const mockSubmission = {
        id: 'submission-id',
        ...submissionData,
        status: 'pending',
        submittedAt: new Date(),
        user: { id: 'user-id', email: 'test@example.com', role: 'user' },
        quest: { id: 'quest-id', title: 'Test Quest', description: 'Test', reward: 100, difficulty: 'easy', category: 'general' }
      };

      (mockPrisma.quest.findUnique as jest.Mock).mockResolvedValue(mockQuest);
      (mockPrisma.submission.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.achievement.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.submission.create as jest.Mock).mockResolvedValue(mockSubmission);

      const result = await submissionService.createSubmission(submissionData);

      expect(mockPrisma.submission.create).toHaveBeenCalledWith({
        data: {
          userId: submissionData.userId,
          questId: submissionData.questId,
          content: submissionData.content,
          status: 'pending'
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true
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
      expect(result).toEqual(mockSubmission);
    });

    it('should throw error if quest not found', async () => {
      const submissionData = {
        questId: 'nonexistent-quest',
        content: 'Test content',
        userId: 'user-id'
      };

      (mockPrisma.quest.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(submissionService.createSubmission(submissionData)).rejects.toThrow('Quest not found');
    });

    it('should throw error if quest is not active', async () => {
      const submissionData = {
        questId: 'quest-id',
        content: 'Test content',
        userId: 'user-id'
      };

      const mockQuest = {
        id: 'quest-id',
        isActive: false
      };

      (mockPrisma.quest.findUnique as jest.Mock).mockResolvedValue(mockQuest);

      await expect(submissionService.createSubmission(submissionData)).rejects.toThrow('Quest is not active');
    });

    it('should throw error if user already submitted', async () => {
      const submissionData = {
        questId: 'quest-id',
        content: 'Test content',
        userId: 'user-id'
      };

      const mockQuest = { id: 'quest-id', isActive: true };
      const existingSubmission = { id: 'existing-submission' };

      (mockPrisma.quest.findUnique as jest.Mock).mockResolvedValue(mockQuest);
      (mockPrisma.submission.findUnique as jest.Mock).mockResolvedValue(existingSubmission);

      await expect(submissionService.createSubmission(submissionData)).rejects.toThrow('You have already submitted this quest');
    });
  });

  describe('updateSubmission', () => {
    it('should update submission successfully', async () => {
      const updateData = {
        status: 'approved' as const,
        feedback: 'Great work!',
        reviewedBy: 'admin-id'
      };

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

      const updatedSubmission = {
        id: 'submission-id',
        ...existingSubmission,
        ...updateData,
        reviewedAt: new Date(),
        user: { id: 'user-id', email: 'test@example.com', role: 'user' },
        quest: { id: 'quest-id', title: 'Test Quest', description: 'Test', reward: 100, difficulty: 'easy', category: 'general' }
      };

      (mockPrisma.submission.findUnique as jest.Mock).mockResolvedValue(existingSubmission);
      (mockPrisma.quest.findUnique as jest.Mock).mockResolvedValue(mockQuest);
      (mockPrisma.achievement.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});
      (mockPrisma.submission.update as jest.Mock).mockResolvedValue(updatedSubmission);

      const result = await submissionService.updateSubmission('submission-id', updateData);

      expect(result).toEqual(updatedSubmission);
      expect(mockPrisma.achievement.create).toHaveBeenCalledWith({
        data: {
          userId: existingSubmission.userId,
          questId: existingSubmission.questId
        }
      });
    });

    it('should throw error if submission not found', async () => {
      (mockPrisma.submission.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(submissionService.updateSubmission('nonexistent-id', {})).rejects.toThrow('Submission not found');
    });

    it('should throw error if submission already reviewed', async () => {
      const existingSubmission = {
        id: 'submission-id',
        status: 'approved'
      };

      (mockPrisma.submission.findUnique as jest.Mock).mockResolvedValue(existingSubmission);

      await expect(submissionService.updateSubmission('submission-id', {})).rejects.toThrow('Cannot update submission that has been reviewed');
    });
  });

  describe('getUserSubmissions', () => {
    it('should return user submissions with pagination', async () => {
      const mockSubmissions = [
        { id: '1', userId: 'user-id', status: 'pending' },
        { id: '2', userId: 'user-id', status: 'approved' }
      ];

      (mockPrisma.submission.findMany as jest.Mock).mockResolvedValue(mockSubmissions);
      (mockPrisma.submission.count as jest.Mock).mockResolvedValue(2);

      const result = await submissionService.getUserSubmissions('user-id', { page: 1, limit: 10 });

      expect(result).toEqual({
        submissions: mockSubmissions,
        total: 2,
        page: 1,
        totalPages: 1
      });
    });

    it('should apply status filter', async () => {
      (mockPrisma.submission.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.submission.count as jest.Mock).mockResolvedValue(0);

      await submissionService.getUserSubmissions('user-id', { status: 'pending' });

      expect(mockPrisma.submission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-id', status: 'pending' }
        })
      );
    });
  });

  describe('deleteSubmission', () => {
    it('should delete submission successfully', async () => {
      const existingSubmission = {
        id: 'submission-id',
        userId: 'user-id',
        status: 'pending'
      };

      (mockPrisma.submission.findUnique as jest.Mock).mockResolvedValue(existingSubmission);
      (mockPrisma.submission.delete as jest.Mock).mockResolvedValue({});

      await expect(submissionService.deleteSubmission('submission-id', 'user-id')).resolves.not.toThrow();

      expect(mockPrisma.submission.delete).toHaveBeenCalledWith({
        where: { id: 'submission-id' }
      });
    });

    it('should throw error if submission not found', async () => {
      (mockPrisma.submission.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(submissionService.deleteSubmission('nonexistent-id')).rejects.toThrow('Submission not found');
    });

    it('should throw error if submission already reviewed', async () => {
      const existingSubmission = {
        id: 'submission-id',
        status: 'approved'
      };

      (mockPrisma.submission.findUnique as jest.Mock).mockResolvedValue(existingSubmission);

      await expect(submissionService.deleteSubmission('submission-id')).rejects.toThrow('Cannot delete submission that has been reviewed');
    });

    it('should throw error if user tries to delete others submission', async () => {
      const existingSubmission = {
        id: 'submission-id',
        userId: 'other-user-id',
        status: 'pending'
      };

      (mockPrisma.submission.findUnique as jest.Mock).mockResolvedValue(existingSubmission);

      await expect(submissionService.deleteSubmission('submission-id', 'user-id')).rejects.toThrow('You can only delete your own submissions');
    });
  });

  describe('getSubmissionStats', () => {
    it('should return submission statistics', async () => {
      const mockStats = {
        total: 10,
        pending: 3,
        approved: 6,
        rejected: 1,
        byQuest: [
          { questId: 'quest1', _count: { questId: 5 } },
          { questId: 'quest2', _count: { questId: 3 } }
        ],
        byUser: [
          { userId: 'user1', _count: { userId: 4 } },
          { userId: 'user2', _count: { userId: 3 } }
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

      const result = await submissionService.getSubmissionStats();

      expect(result).toEqual({
        total: 10,
        pending: 3,
        approved: 6,
        rejected: 1,
        byQuest: { quest1: 5, quest2: 3 },
        byUser: { user1: 4, user2: 3 }
      });
    });
  });
});
