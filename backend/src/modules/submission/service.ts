import { PrismaClient } from '@prisma/client';
import { ISubmissionService, ICreateSubmissionData, IUpdateSubmissionData, ISubmissionResponse } from './interfaces';
import { SubmissionError } from './utils';

const prisma = new PrismaClient();

export class SubmissionService implements ISubmissionService {
  async createSubmission(data: ICreateSubmissionData): Promise<ISubmissionResponse> {
    // Check if quest exists and is active
    const quest = await prisma.quest.findUnique({
      where: { id: data.questId }
    });

    if (!quest) {
      throw new SubmissionError('Quest not found', 404);
    }

    if (!quest.isActive) {
      throw new SubmissionError('Quest is not active', 400);
    }

    // Check if user already submitted this quest
    const existingSubmission = await prisma.submission.findUnique({
      where: {
        userId_questId: {
          userId: data.userId,
          questId: data.questId
        }
      }
    });

    if (existingSubmission) {
      throw new SubmissionError('You have already submitted this quest', 409);
    }

    // Check if user already completed this quest
    const existingAchievement = await prisma.achievement.findUnique({
      where: {
        userId_questId: {
          userId: data.userId,
          questId: data.questId
        }
      }
    });

    if (existingAchievement) {
      throw new SubmissionError('You have already completed this quest', 409);
    }

    const submission = await prisma.submission.create({
      data: {
        userId: data.userId,
        questId: data.questId,
        content: data.content,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
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

    return submission;
  }

  async getSubmissionById(submissionId: string): Promise<ISubmissionResponse> {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
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

    if (!submission) {
      throw new SubmissionError('Submission not found', 404);
    }

    return submission;
  }

  async updateSubmission(submissionId: string, data: IUpdateSubmissionData): Promise<ISubmissionResponse> {
    const existingSubmission = await prisma.submission.findUnique({
      where: { id: submissionId }
    });

    if (!existingSubmission) {
      throw new SubmissionError('Submission not found', 404);
    }

    // Only allow updating pending submissions
    if (existingSubmission.status !== 'pending') {
      throw new SubmissionError('Cannot update submission that has been reviewed', 400);
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        ...data,
        reviewedAt: data.status !== 'pending' ? new Date() : null,
        reviewedBy: data.status !== 'pending' ? data.reviewedBy : null
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

    // If approved, create achievement and award points
    if (data.status === 'approved') {
      await this.createAchievementAndAwardPoints(existingSubmission.userId, existingSubmission.questId);
    }

    return updatedSubmission;
  }

  async getUserSubmissions(userId: string, filters: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}): Promise<{
    submissions: ISubmissionResponse[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, status } = filters;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        skip,
        take: limit,
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
        },
        orderBy: {
          submittedAt: 'desc'
        }
      }),
      prisma.submission.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      submissions,
      total,
      page,
      totalPages
    };
  }

  async getAllSubmissions(filters: {
    page?: number;
    limit?: number;
    status?: string;
    questId?: string;
    userId?: string;
  } = {}): Promise<{
    submissions: ISubmissionResponse[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, status, questId, userId } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (questId) where.questId = questId;
    if (userId) where.userId = userId;

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        skip,
        take: limit,
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
        },
        orderBy: {
          submittedAt: 'desc'
        }
      }),
      prisma.submission.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      submissions,
      total,
      page,
      totalPages
    };
  }

  async deleteSubmission(submissionId: string, userId?: string): Promise<void> {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId }
    });

    if (!submission) {
      throw new SubmissionError('Submission not found', 404);
    }

    // Only allow deletion of pending submissions by the submitter or admin
    if (submission.status !== 'pending') {
      throw new SubmissionError('Cannot delete submission that has been reviewed', 400);
    }

    if (userId && submission.userId !== userId) {
      throw new SubmissionError('You can only delete your own submissions', 403);
    }

    await prisma.submission.delete({
      where: { id: submissionId }
    });
  }

  async getSubmissionStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    byQuest: Record<string, number>;
    byUser: Record<string, number>;
  }> {
    const [total, pending, approved, rejected, byQuest, byUser] = await Promise.all([
      prisma.submission.count(),
      prisma.submission.count({ where: { status: 'pending' } }),
      prisma.submission.count({ where: { status: 'approved' } }),
      prisma.submission.count({ where: { status: 'rejected' } }),
      prisma.submission.groupBy({
        by: ['questId'],
        _count: { questId: true }
      }),
      prisma.submission.groupBy({
        by: ['userId'],
        _count: { userId: true }
      })
    ]);

    const questStats = byQuest.reduce((acc: any, item: any) => {
      acc[item.questId] = item._count.questId;
      return acc;
    }, {});

    const userStats = byUser.reduce((acc: any, item: any) => {
      acc[item.userId] = item._count.userId;
      return acc;
    }, {});

    return {
      total,
      pending,
      approved,
      rejected,
      byQuest: questStats,
      byUser: userStats
    };
  }

  private async createAchievementAndAwardPoints(userId: string, questId: string): Promise<void> {
    // Get quest details for reward
    const quest = await prisma.quest.findUnique({
      where: { id: questId }
    });

    if (!quest) return;

    // Create achievement
    await prisma.achievement.create({
      data: {
        userId,
        questId
      }
    });

    // Award points to user
    await prisma.user.update({
      where: { id: userId },
      data: {
        points: {
          increment: quest.reward
        }
      }
    });
  }
}
