import { Request, Response, NextFunction } from 'express';
import { UserService } from './service';
import { IUpdateUserData } from './interfaces';
import { validateUpdateUser, validatePointsOperation } from './validation';
import { asyncHandler } from './utils';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const user = await this.userService.getUserById(userId);

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const validatedData: IUpdateUserData = validateUpdateUser(req.body);
      const user = await this.userService.updateUser(userId, validatedData);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const user = await this.userService.getUserById(userId);

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const validatedData: IUpdateUserData = validateUpdateUser(req.body);
      const user = await this.userService.updateUser(userId, validatedData);

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  addPoints = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const { points } = validatePointsOperation(req.body);
      const user = await this.userService.addPoints(userId, points);

      res.status(200).json({
        success: true,
        message: `Added ${points} points to user`,
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  deductPoints = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const { points } = validatePointsOperation(req.body);
      const user = await this.userService.deductPoints(userId, points);

      res.status(200).json({
        success: true,
        message: `Deducted ${points} points from user`,
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await this.userService.getAllUsers(page, limit);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      await this.userService.deleteUser(userId);

      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };
}
