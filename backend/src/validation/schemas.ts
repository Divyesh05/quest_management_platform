import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

// Quest schemas
export const questCreateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  reward: z.number().min(1, 'Reward must be at least 1 point').max(1000, 'Reward cannot exceed 1000 points'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  category: z.string().min(2, 'Category must be at least 2 characters'),
});

export const questUpdateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').optional(),
  reward: z.number().min(1, 'Reward must be at least 1 point').max(1000, 'Reward cannot exceed 1000 points').optional(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
  category: z.string().min(2, 'Category must be at least 2 characters').optional(),
  isActive: z.boolean().optional(),
});

// Submission schemas
export const submissionCreateSchema = z.object({
  questId: z.string().uuid('Invalid quest ID'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
});

export const submissionUpdateSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  feedback: z.string().optional(),
  score: z.number().min(0, 'Score must be at least 0').max(100, 'Score cannot exceed 100').optional(),
});

// Pagination schemas
export const paginationSchema = z.object({
  page: z.coerce.number().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// User profile schemas
export const profileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
});

// ID parameter schema
export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

// Query schemas
export const questQuerySchema = paginationSchema.extend({
  category: z.string().optional(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
  isActive: z.coerce.boolean().optional(),
});

export const submissionQuerySchema = paginationSchema.extend({
  userId: z.string().uuid().optional(),
  questId: z.string().uuid().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type QuestCreateInput = z.infer<typeof questCreateSchema>;
export type QuestUpdateInput = z.infer<typeof questUpdateSchema>;
export type SubmissionCreateInput = z.infer<typeof submissionCreateSchema>;
export type SubmissionUpdateInput = z.infer<typeof submissionUpdateSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type QuestQueryInput = z.infer<typeof questQuerySchema>;
export type SubmissionQueryInput = z.infer<typeof submissionQuerySchema>;
