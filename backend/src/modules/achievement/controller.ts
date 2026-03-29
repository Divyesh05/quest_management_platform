import { Request, Response, NextFunction } from 'express';
import { AchievementService } from './service';
import { validateAchievementFilters, validateLeaderboardFilters } from './validation';

export class AchievementController {
  private achievementService: AchievementService;

  constructor() {
    this.achievementService = new AchievementService();
  }

  getUserAchievements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const filters = validateAchievementFilters(req.query);
      const result = await this.achievementService.getUserAchievements(userId, filters);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getAchievementById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { achievementId } = req.params;
      const achievement = await this.achievementService.getAchievementById(achievementId);

      // Check if user owns this achievement or is admin
      const requestingUser = (req as any).user;
      if (achievement.user.id !== requestingUser.userId && requestingUser.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: achievement
      });
    } catch (error) {
      next(error);
    }
  };

  getAllAchievements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = validateAchievementFilters(req.query);
      const result = await this.achievementService.getAllAchievements(filters);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getLeaderboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = validateLeaderboardFilters(req.query);
      const result = await this.achievementService.getLeaderboard(filters);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getUserAchievementStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const stats = await this.achievementService.getUserAchievementStats(userId);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  };

  getGlobalAchievementStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.achievementService.getGlobalAchievementStats();

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  };

  deleteAchievement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { achievementId } = req.params;
      const requestingUser = (req as any).user;
      
      // Users can only delete their own achievements
      // Admins can delete any achievement
      const userId = requestingUser.role === 'admin' ? undefined : requestingUser.userId;
      
      await this.achievementService.deleteAchievement(achievementId, userId);

      res.status(200).json({
        success: true,
        message: 'Achievement deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  getAchievementLeaderboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = validateLeaderboardFilters(req.query);
      const result = await this.achievementService.getLeaderboard(filters);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getMyAchievements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const filters = validateAchievementFilters(req.query);
      const result = await this.achievementService.getUserAchievements(userId, filters);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  createAchievement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, questId } = req.body;
      const result = await this.achievementService.createAchievement(userId, questId);

      res.status(201).json({
        success: true,
        message: 'Achievement created successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  updateAchievement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const result = await this.achievementService.updateAchievement(id, updateData);

      res.status(200).json({
        success: true,
        message: 'Achievement updated successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };
}
