import { Request, Response, NextFunction } from 'express';
import { SubmissionService } from './service';
import { ICreateSubmissionData, IUpdateSubmissionData } from './interfaces';
import { validateCreateSubmission, validateUpdateSubmission, validateSubmissionFilters } from './validation';
import { asyncHandler } from './utils';

export class SubmissionController {
  private submissionService: SubmissionService;

  constructor() {
    this.submissionService = new SubmissionService();
  }

  createSubmission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData: ICreateSubmissionData = {
        ...validateCreateSubmission(req.body),
        userId: (req as any).user.userId
      };
      const submission = await this.submissionService.createSubmission(validatedData);

      res.status(201).json({
        success: true,
        message: 'Submission created successfully',
        data: submission
      });
    } catch (error) {
      next(error);
    }
  };

  getSubmissionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { submissionId } = req.params;
      const submission = await this.submissionService.getSubmissionById(submissionId);

      // Check if user owns this submission or is admin
      const requestingUser = (req as any).user;
      if (submission.user.id !== requestingUser.userId && requestingUser.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: submission
      });
    } catch (error) {
      next(error);
    }
  };

  updateSubmission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { submissionId } = req.params;
      const validatedData: IUpdateSubmissionData = {
        ...validateUpdateSubmission(req.body),
        reviewedBy: (req as any).user.userId
      };
      const submission = await this.submissionService.updateSubmission(submissionId, validatedData);

      res.status(200).json({
        success: true,
        message: 'Submission updated successfully',
        data: submission
      });
    } catch (error) {
      next(error);
    }
  };

  getUserSubmissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const filters = validateSubmissionFilters(req.query);
      const result = await this.submissionService.getUserSubmissions(userId, filters);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getAllSubmissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = validateSubmissionFilters(req.query);
      const result = await this.submissionService.getAllSubmissions(filters);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  deleteSubmission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { submissionId } = req.params;
      const requestingUser = (req as any).user;
      
      // Users can only delete their own pending submissions
      // Admins can delete any pending submission
      const userId = requestingUser.role === 'admin' ? undefined : requestingUser.userId;
      
      await this.submissionService.deleteSubmission(submissionId, userId);

      res.status(200).json({
        success: true,
        message: 'Submission deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  approveSubmission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { submissionId } = req.params;
      const { feedback } = req.body;
      const reviewedBy = (req as any).user.userId;
      
      const submission = await this.submissionService.updateSubmission(submissionId, {
        status: 'approved',
        feedback,
        reviewedBy
      });

      res.status(200).json({
        success: true,
        message: 'Submission approved successfully',
        data: submission
      });
    } catch (error) {
      next(error);
    }
  };

  rejectSubmission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { submissionId } = req.params;
      const { feedback } = req.body;
      const reviewedBy = (req as any).user.userId;
      
      const submission = await this.submissionService.updateSubmission(submissionId, {
        status: 'rejected',
        feedback,
        reviewedBy
      });

      res.status(200).json({
        success: true,
        message: 'Submission rejected successfully',
        data: submission
      });
    } catch (error) {
      next(error);
    }
  };

  getSubmissionStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.submissionService.getSubmissionStats();

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  };
}
