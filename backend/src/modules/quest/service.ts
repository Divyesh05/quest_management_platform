import { PrismaClient } from '@prisma/client';
import { IQuestService, ICreateQuestData, IUpdateQuestData, IQuestResponse } from './interfaces';
import { QuestError } from './utils';

const prisma = new PrismaClient();

export class QuestService implements IQuestService {
  async createQuest(data: ICreateQuestData): Promise<IQuestResponse> {
    const quest = await prisma.quest.create({
      data: {
        title: data.title,
        description: data.description,
        reward: data.reward,
        difficulty: data.difficulty || 'medium',
        category: data.category || 'general',
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdBy: data.createdBy
      }
    });

    return quest;
  }

  async getQuestById(questId: string): Promise<IQuestResponse> {
    const quest = await prisma.quest.findUnique({
      where: { id: questId }
    });

    if (!quest) {
      throw new QuestError('Quest not found', 404);
    }

    return quest;
  }

  async updateQuest(questId: string, data: IUpdateQuestData): Promise<IQuestResponse> {
    // Check if quest exists
    const existingQuest = await prisma.quest.findUnique({
      where: { id: questId }
    });

    if (!existingQuest) {
      throw new QuestError('Quest not found', 404);
    }

    const updatedQuest = await prisma.quest.update({
      where: { id: questId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });

    return updatedQuest;
  }

  async deleteQuest(questId: string): Promise<void> {
    const existingQuest = await prisma.quest.findUnique({
      where: { id: questId }
    });

    if (!existingQuest) {
      throw new QuestError('Quest not found', 404);
    }

    // Check if there are any submissions for this quest
    const submissionsCount = await prisma.submission.count({
      where: { questId }
    });

    if (submissionsCount > 0) {
      throw new QuestError('Cannot delete quest with existing submissions', 400);
    }

    await prisma.quest.delete({
      where: { id: questId }
    });
  }

  async getAllQuests(filters: {
    page?: number;
    limit?: number;
    difficulty?: string;
    category?: string;
    isActive?: boolean;
    search?: string;
  } = {}): Promise<{
    quests: IQuestResponse[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, difficulty, category, isActive, search } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (category) {
      where.category = category;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [quests, total] = await Promise.all([
      prisma.quest.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.quest.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      quests,
      total,
      page,
      totalPages
    };
  }

  async getActiveQuests(page: number = 1, limit: number = 10): Promise<{
    quests: IQuestResponse[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return this.getAllQuests({ page, limit, isActive: true });
  }

  async getQuestsByCategory(category: string, page: number = 1, limit: number = 10): Promise<{
    quests: IQuestResponse[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return this.getAllQuests({ page, limit, category });
  }

  async getQuestsByDifficulty(difficulty: string, page: number = 1, limit: number = 10): Promise<{
    quests: IQuestResponse[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return this.getAllQuests({ page, limit, difficulty });
  }

  async toggleQuestStatus(questId: string): Promise<IQuestResponse> {
    const quest = await this.getQuestById(questId);

    const updatedQuest = await prisma.quest.update({
      where: { id: questId },
      data: {
        isActive: !quest.isActive,
        updatedAt: new Date()
      }
    });

    return updatedQuest;
  }

  async getQuestStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byDifficulty: Record<string, number>;
    byCategory: Record<string, number>;
  }> {
    const [total, active, inactive, byDifficulty, byCategory] = await Promise.all([
      prisma.quest.count(),
      prisma.quest.count({ where: { isActive: true } }),
      prisma.quest.count({ where: { isActive: false } }),
      prisma.quest.groupBy({
        by: ['difficulty'],
        _count: { difficulty: true }
      }),
      prisma.quest.groupBy({
        by: ['category'],
        _count: { category: true }
      })
    ]);

    const difficultyStats = byDifficulty.reduce((acc, item) => {
      acc[item.difficulty] = item._count.difficulty;
      return acc;
    }, {} as Record<string, number>);

    const categoryStats = byCategory.reduce((acc, item) => {
      acc[item.category] = item._count.category;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      active,
      inactive,
      byDifficulty: difficultyStats,
      byCategory: categoryStats
    };
  }
}
