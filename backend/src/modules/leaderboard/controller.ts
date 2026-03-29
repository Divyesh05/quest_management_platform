import { Request, Response, NextFunction } from 'express';
import { LeaderboardService } from './service';
import { ILeaderboardFilters } from './interfaces';
import { validateLeaderboardFilters } from './validation';

export class LeaderboardController {
  private leaderboardService: LeaderboardService;

  constructor() {
    this.leaderboardService = new LeaderboardService();
  }

  getGlobalLeaderboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = validateLeaderboardFilters(req.query);
      const result = await this.leaderboardService.getGlobalLeaderboard(filters);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getUserLeaderboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const filters = validateLeaderboardFilters(req.query);
      const result = await this.leaderboardService.getUserLeaderboard(userId, filters);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getQuestLeaderboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { questId } = req.params;
      const filters = validateLeaderboardFilters(req.query);
      const result = await this.leaderboardService.getQuestLeaderboard(questId, filters);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getCategoryLeaderboards = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { timeRange = 'all' } = req.query;
      const result = await this.leaderboardService.getCategoryLeaderboards(timeRange as any);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getLeaderboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { timeRange = 'all' } = req.query;
      const stats = await this.leaderboardService.getLeaderboardStats(timeRange as any);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  };

  getUserRanking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const { timeRange = 'all' } = req.query;
      const ranking = await this.leaderboardService.getUserRanking(userId, timeRange as any);

      res.status(200).json({
        success: true,
        data: ranking
      });
    } catch (error) {
      next(error);
    }
  };

  getLeaderboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = validateLeaderboardFilters(req.query);
      const result = await this.leaderboardService.getGlobalLeaderboard(filters);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getTopUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = parseInt(req.params.limit) || 10;
      const result = await this.leaderboardService.getGlobalLeaderboard({ limit });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getUserRank = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const ranking = await this.leaderboardService.getUserRanking(userId, 'all');

      res.status(200).json({
        success: true,
        data: ranking
      });
    } catch (error) {
      next(error);
    }
  };

  getUserBadges = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const badges = await this.leaderboardService.getUserBadges(userId);

      res.status(200).json({
        success: true,
        data: badges
      });
    } catch (error) {
      next(error);
    }
  };

  getMyRank = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const ranking = await this.leaderboardService.getUserRanking(userId, 'all');

      res.status(200).json({
        success: true,
        data: ranking
      });
    } catch (error) {
      next(error);
    }
  };

  getMyBadges = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const badges = await this.leaderboardService.getUserBadges(userId);

      res.status(200).json({
        success: true,
        data: badges
      });
    } catch (error) {
      next(error);
    }
  };
}
