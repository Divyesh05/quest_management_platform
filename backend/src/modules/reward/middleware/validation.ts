import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const rewardSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  questId: z.string().uuid('Invalid quest ID').optional(),
  type: z.string().min(1, 'Type is required'),
  points: z.number().int().positive('Points must be positive'),
  description: z.string().min(1, 'Description is required'),
});

export const validateReward = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    rewardSchema.parse(req.body);
    next();
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.errors,
    });
  }
};
