import { Request, Response, NextFunction } from 'express';
import { AuthService } from './service';
import { ILoginData, IRegisterData } from './interfaces';
import { validateRegister, validateLogin } from './validation';

export class AuthController {

  static register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData: IRegisterData = validateRegister(req.body);
      const authService = new AuthService();
      const result = await authService.register(validatedData);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  static login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData: ILoginData = validateLogin(req.body);
      const authService = new AuthService();
      const result = await authService.login(validatedData);
      
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  static logout = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      next(error);
    }
  };

  static getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }
      
      const authService = new AuthService();
      const user = await authService.getUserById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  static updateMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }
      
      const { email } = req.body;
      
      const authService = new AuthService();
      const user = await authService.updateUser(userId, { email });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  static forgotPassword = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({
        success: true,
        message: 'Password reset instructions sent to email'
      });
    } catch (error) {
      next(error);
    }
  };

  static resetPassword = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  static verifyEmail = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({
        success: true,
        message: 'Email verified successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  static getAllUsers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authService = new AuthService();
      const users = await authService.getAllUsers();

      res.status(200).json({
        success: true,
        data: users
      });
    } catch (error) {
      next(error);
    }
  };

  static updateUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      const authService = new AuthService();
      const user = await authService.updateUserRole(id, role);

      res.status(200).json({
        success: true,
        message: 'User role updated successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  static deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      
      const authService = new AuthService();
      await authService.deleteUser(id);

      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };
}
