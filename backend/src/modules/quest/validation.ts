import { z } from 'zod';
import { ICreateQuestData, IUpdateQuestData, IQuestFilters } from './interfaces';

export const createQuestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description too long'),
  reward: z.number().positive('Reward must be positive'),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('medium'),
  category: z.string().min(1, 'Category is required').max(50, 'Category too long').optional().default('general'),
  isActive: z.boolean().optional().default(true)
});

export const updateQuestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().min(1, 'Description is required').max(2000, 'Description too long').optional(),
  reward: z.number().positive('Reward must be positive').optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  category: z.string().min(1, 'Category is required').max(50, 'Category too long').optional(),
  isActive: z.boolean().optional()
});

export const questFiltersSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().positive().default(1)),
  limit: z.string().transform(Number).pipe(z.number().positive().max(100).default(10)),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  category: z.string().optional(),
  isActive: z.string().transform(Boolean).optional(),
  search: z.string().max(100, 'Search term too long').optional()
});

export const validateCreateQuest = (data: unknown): Omit<ICreateQuestData, 'createdBy'> => {
  return createQuestSchema.parse(data);
};

export const validateUpdateQuest = (data: unknown): IUpdateQuestData => {
  return updateQuestSchema.parse(data);
};

export const validateQuestFilters = (query: unknown): IQuestFilters => {
  return questFiltersSchema.parse(query);
};
