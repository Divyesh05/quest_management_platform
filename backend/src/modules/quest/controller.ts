import { Request, Response, NextFunction } from 'express';
import { QuestService } from './service';
import { ICreateQuestData, IUpdateQuestData } from './interfaces';
import { validateCreateQuest, validateUpdateQuest, validateQuestFilters } from './validation';
import { asyncHandler } from './utils';

export class QuestController {
  private questService: QuestService;

  constructor() {
    this.questService = new QuestService();
  }

  createQuest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData: ICreateQuestData = {
        ...validateCreateQuest(req.body),
        createdBy: (req as any).user.userId
      };
      const quest = await this.questService.createQuest(validatedData);

      res.status(201).json({
        success: true,
        message: 'Quest created successfully',
        data: quest
      });
    } catch (error) {
      next(error);
    }
  };

  getQuestById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { questId } = req.params;
      const quest = await this.questService.getQuestById(questId);

      res.status(200).json({
        success: true,
        data: quest
      });
    } catch (error) {
      next(error);
    }
  };

  updateQuest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { questId } = req.params;
      const validatedData: IUpdateQuestData = validateUpdateQuest(req.body);
      const quest = await this.questService.updateQuest(questId, validatedData);

      res.status(200).json({
        success: true,
        message: 'Quest updated successfully',
        data: quest
      });
    } catch (error) {
      next(error);
    }
  };

  deleteQuest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { questId } = req.params;
      await this.questService.deleteQuest(questId);

      res.status(200).json({
        success: true,
        message: 'Quest deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  getAllQuests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = validateQuestFilters(req.query);
      const result = await this.questService.getAllQuests(filters);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getActiveQuests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await this.questService.getActiveQuests(page, limit);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getQuestsByCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { category } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await this.questService.getQuestsByCategory(category, page, limit);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getQuestsByDifficulty = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { difficulty } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await this.questService.getQuestsByDifficulty(difficulty, page, limit);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  toggleQuestStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { questId } = req.params;
      const quest = await this.questService.toggleQuestStatus(questId);

      res.status(200).json({
        success: true,
        message: `Quest ${quest.isActive ? 'activated' : 'deactivated'} successfully`,
        data: quest
      });
    } catch (error) {
      next(error);
    }
  };

  getQuestStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.questService.getQuestStats();

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  };
}
