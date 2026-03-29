import { Request, Response, NextFunction } from 'express';
import { RewardService } from './service';
import { ICreateRewardData, IUpdateRewardData } from './interfaces';
import { validateCreateReward, validateUpdateReward, validateRewardFilters } from './validation';

export class RewardController {
  private rewardService: RewardService;

  constructor() {
    this.rewardService = new RewardService();
  }

  createReward = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData: ICreateRewardData = validateCreateReward(req.body);
      const reward = await this.rewardService.createReward(validatedData);

      res.status(201).json({
        success: true,
        message: 'Reward created successfully',
        data: reward
      });
    } catch (error) {
      next(error);
    }
  };

  getRewardById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { rewardId } = req.params;
      const reward = await this.rewardService.getRewardById(rewardId);

      // Check if user owns this reward or is admin
      const requestingUser = (req as any).user;
      if (reward.user.id !== requestingUser.userId && requestingUser.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: reward
      });
    } catch (error) {
      next(error);
    }
  };

  updateReward = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { rewardId } = req.params;
      const validatedData: IUpdateRewardData = validateUpdateReward(req.body);
      const reward = await this.rewardService.updateReward(rewardId, validatedData);

      res.status(200).json({
        success: true,
        message: 'Reward updated successfully',
        data: reward
      });
    } catch (error) {
      next(error);
    }
  };

  deleteReward = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { rewardId } = req.params;
      await this.rewardService.deleteReward(rewardId);

      res.status(200).json({
        success: true,
        message: 'Reward deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  getUserRewards = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const filters = validateRewardFilters(req.query);
      const result = await this.rewardService.getUserRewards(userId, filters);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getAllRewards = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = validateRewardFilters(req.query);
      const result = await this.rewardService.getAllRewards(filters);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getRewardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { timeRange } = req.query;
      const stats = await this.rewardService.getRewardStats(timeRange as any);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  };

  awardQuestReward = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, questId } = req.params;
      const { bonusPoints = 0 } = req.body;
      const reward = await this.rewardService.awardQuestReward(userId, questId, bonusPoints);

      res.status(201).json({
        success: true,
        message: 'Quest reward awarded successfully',
        data: reward
      });
    } catch (error) {
      next(error);
    }
  };

  awardBonusReward = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const { points, description, metadata } = req.body;
      const reward = await this.rewardService.awardBonusReward(userId, points, description, metadata);

      res.status(201).json({
        success: true,
        message: 'Bonus reward awarded successfully',
        data: reward
      });
    } catch (error) {
      next(error);
    }
  };

  awardStreakReward = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const { streakCount, points } = req.body;
      const reward = await this.rewardService.awardStreakReward(userId, streakCount, points);

      res.status(201).json({
        success: true,
        message: 'Streak reward awarded successfully',
        data: reward
      });
    } catch (error) {
      next(error);
    }
  };

  getMyRewards = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const filters = validateRewardFilters(req.query);
      const result = await this.rewardService.getUserRewards(userId, filters);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getMyPoints = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const points = await this.rewardService.getUserPoints(userId);

      res.status(200).json({
        success: true,
        data: { points }
      });
    } catch (error) {
      next(error);
    }
  };

  getRewardHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const history = await this.rewardService.getRewardHistory(userId);

      res.status(200).json({
        success: true,
        data: history
      });
    } catch (error) {
      next(error);
    }
  };

  grantReward = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData: ICreateRewardData = validateCreateReward(req.body);
      const reward = await this.rewardService.createReward(validatedData);

      res.status(201).json({
        success: true,
        message: 'Reward granted successfully',
        data: reward
      });
    } catch (error) {
      next(error);
    }
  };

  awardPoints = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const { points, description } = req.body;
      const reward = await this.rewardService.awardBonusReward(userId, points, description || 'Admin awarded points');

      res.status(201).json({
        success: true,
        message: 'Points awarded successfully',
        data: reward
      });
    } catch (error) {
      next(error);
    }
  };
}
