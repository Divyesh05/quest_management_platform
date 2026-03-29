import { z } from 'zod';
import { IUpdateUserData, IPointsOperation } from './interfaces';

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  role: z.enum(['user', 'admin']).optional()
});

export const pointsOperationSchema = z.object({
  points: z.number().positive('Points must be greater than 0')
});

export const paginationSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().positive().default(1)),
  limit: z.string().transform(Number).pipe(z.number().positive().max(100).default(10))
});

export const validateUpdateUser = (data: unknown): IUpdateUserData => {
  return updateUserSchema.parse(data);
};

export const validatePointsOperation = (data: unknown): IPointsOperation => {
  return pointsOperationSchema.parse(data);
};

export const validatePagination = (query: unknown) => {
  return paginationSchema.parse(query);
};
