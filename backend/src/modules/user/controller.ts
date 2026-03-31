import { Request, Response, NextFunction } from 'express';
import { UserService } from './service';
import { IUpdateUserData } from './interfaces';
import { validateUpdateUser, validatePointsOperation } from './validation';

const userService = new UserService();

export class UserController {
  static getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const user = await userService.getUserById(userId);

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  static updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const validatedData: IUpdateUserData = validateUpdateUser(req.body);
      const user = await userService.updateUser(userId, validatedData);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  static getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  static updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const validatedData: IUpdateUserData = validateUpdateUser(req.body);
      const user = await userService.updateUser(id, validatedData);

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  static addPoints = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { points } = validatePointsOperation(req.body);
      const user = await userService.addPoints(id, points);

      res.status(200).json({
        success: true,
        message: `Added ${points} points to user`,
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  static deductPoints = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { points } = validatePointsOperation(req.body);
      const user = await userService.deductPoints(id, points);

      res.status(200).json({
        success: true,
        message: `Deducted ${points} points from user`,
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  static getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await userService.getAllUsers(page, limit);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  static deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await userService.deleteUser(id);

      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  static getPublicProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  static uploadAvatar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Avatar upload logic would go here
      res.status(200).json({
        success: true,
        message: 'Avatar uploaded successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  static changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const { currentPassword, newPassword } = req.body;
      await userService.changePassword(userId, currentPassword, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  static deleteAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      await userService.deleteUser(userId);

      res.status(200).json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };
}
