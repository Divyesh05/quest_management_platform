import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const submissionSchema = z.object({
  questId: z.string().uuid('Invalid quest ID'),
  content: z.string().min(1, 'Content is required'),
});

export const validateSubmission = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    submissionSchema.parse(req.body);
    next();
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.errors,
    });
  }
};
