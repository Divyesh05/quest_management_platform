import { z } from 'zod';
import { ICreateRewardData, IUpdateRewardData, IRewardFilters } from './interfaces';

export const createRewardSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  questId: z.string().optional(),
  type: z.enum(['quest_completion', 'bonus', 'streak', 'achievement', 'referral']),
  points: z.number().int('Points must be an integer').positive('Points must be positive'),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  metadata: z.any().optional()
});

export const updateRewardSchema = z.object({
  type: z.enum(['quest_completion', 'bonus', 'streak', 'achievement', 'referral']).optional(),
  points: z.number().int('Points must be an integer').positive('Points must be positive').optional(),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long').optional(),
  metadata: z.any().optional()
});

export const rewardFiltersSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().positive().default(1)),
  limit: z.string().transform(Number).pipe(z.number().positive().max(100).default(10)),
  userId: z.string().optional(),
  type: z.enum(['quest_completion', 'bonus', 'streak', 'achievement', 'referral']).optional(),
  questId: z.string().optional()
});

export const awardQuestRewardSchema = z.object({
  bonusPoints: z.number().int('Bonus points must be an integer').min(0, 'Bonus points must be non-negative').default(0)
});

export const awardBonusRewardSchema = z.object({
  points: z.number().int('Points must be an integer').positive('Points must be positive'),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  metadata: z.any().optional()
});

export const awardStreakRewardSchema = z.object({
  streakCount: z.number().int('Streak count must be an integer').positive('Streak count must be positive'),
  points: z.number().int('Points must be an integer').positive('Points must be positive')
});

export const validateCreateReward = (data: unknown): ICreateRewardData => {
  return createRewardSchema.parse(data);
};

export const validateUpdateReward = (data: unknown): IUpdateRewardData => {
  return updateRewardSchema.parse(data);
};

export const validateRewardFilters = (query: unknown): IRewardFilters => {
  return rewardFiltersSchema.parse(query);
};

export const validateAwardQuestReward = (data: unknown) => {
  return awardQuestRewardSchema.parse(data);
};

export const validateAwardBonusReward = (data: unknown) => {
  return awardBonusRewardSchema.parse(data);
};

export const validateAwardStreakReward = (data: unknown) => {
  return awardStreakRewardSchema.parse(data);
};
