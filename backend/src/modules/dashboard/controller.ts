import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './service';
import { ITimeRangeFilter } from './interfaces';
import { validateTimeRangeFilter } from './validation';
import { asyncHandler } from './utils';

export class DashboardController {
  private dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = validateTimeRangeFilter(req.query);
      const stats = await this.dashboardService.getDashboardStats(filters.timeRange);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  };

  getUserDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const filters = validateTimeRangeFilter(req.query);
      const stats = await this.dashboardService.getUserDashboardStats(userId, filters.timeRange);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  };

  getQuestAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { questId } = req.params;
      const filters = validateTimeRangeFilter(req.query);
      const analytics = await this.dashboardService.getQuestAnalytics(questId, filters.timeRange);

      res.status(200).json({
        success: true,
        data: analytics
      });
    } catch (error) {
      next(error);
    }
  };
}
