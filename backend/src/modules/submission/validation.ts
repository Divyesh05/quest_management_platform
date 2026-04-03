import { z } from 'zod';
import { ICreateSubmissionData, IUpdateSubmissionData, ISubmissionFilters } from './interfaces';

export const createSubmissionSchema = z.object({
  questId: z.string().min(1, 'Quest ID is required'),
  content: z.string().max(5000, 'Content too long').optional()
});

export const updateSubmissionSchema = z.object({
  content: z.string().min(1, 'Content is required').max(5000, 'Content too long').optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  feedback: z.string().max(2000, 'Feedback too long').optional(),
  reviewedBy: z.string().optional()
});

export const submissionFiltersSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().positive().default(1)),
  limit: z.string().transform(Number).pipe(z.number().positive().max(100).default(10)),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  questId: z.string().optional(),
  userId: z.string().optional()
});

export const reviewSubmissionSchema = z.object({
  feedback: z.string().max(2000, 'Feedback too long').optional()
});

export const validateCreateSubmission = (data: unknown): Omit<ICreateSubmissionData, 'userId'> => {
  return createSubmissionSchema.parse(data);
};

export const validateUpdateSubmission = (data: unknown): IUpdateSubmissionData => {
  return updateSubmissionSchema.parse(data);
};

export const validateSubmissionFilters = (query: unknown): ISubmissionFilters => {
  return submissionFiltersSchema.parse(query);
};

export const validateReviewSubmission = (data: unknown) => {
  return reviewSubmissionSchema.parse(data);
};
