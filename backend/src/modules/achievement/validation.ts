import { z } from 'zod';

export const achievementFiltersSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  userId: z.string().uuid().optional(),
  questId: z.string().uuid().optional(),
});

export const leaderboardFiltersSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  timeRange: z.enum(['day', 'week', 'month', 'all']).optional().default('all'),
});

export const validateAchievementFilters = (data: unknown) => {
  return achievementFiltersSchema.parse(data);
};

export const validateLeaderboardFilters = (data: unknown) => {
  return leaderboardFiltersSchema.parse(data);
};
