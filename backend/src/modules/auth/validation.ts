import { z } from 'zod';
import { IRegisterData, ILoginData } from './interfaces';

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['user', 'admin']).optional().default('user')
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

export const validateRegister = (data: unknown): IRegisterData => {
  return registerSchema.parse(data);
};

export const validateLogin = (data: unknown): ILoginData => {
  return loginSchema.parse(data);
};
