import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const questSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  reward: z.number().int().positive('Reward must be positive'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  category: z.string().min(1, 'Category is required'),
  isActive: z.boolean().optional().default(true),
});

export const validateQuest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    questSchema.parse(req.body);
    next();
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.errors,
    });
  }
};
