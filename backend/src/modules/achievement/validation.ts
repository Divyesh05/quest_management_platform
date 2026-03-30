import { z } from 'zod';

export const achievementFiltersSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  userId: z.string().uuid().optional(),
  questId: z.string().uuid().optional(),
  category: z.string().optional(),
  difficulty: z.string().optional(),
  timeRange: z.enum(['day', 'week', 'month', 'year', 'all']).optional(),
});

export const leaderboardFiltersSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  timeRange: z.enum(['day', 'week', 'month', 'year', 'all']).optional().default('all'),
});

export const validateAchievementFilters = (data: unknown) => {
  const parsed = achievementFiltersSchema.parse(data);
  return {
    ...parsed,
    page: parsed.page ? parseInt(parsed.page, 10) : undefined,
    limit: parsed.limit ? parseInt(parsed.limit, 10) : undefined,
  };
};

export const validateLeaderboardFilters = (data: unknown) => {
  const parsed = leaderboardFiltersSchema.parse(data);
  return {
    ...parsed,
    page: parsed.page ? parseInt(parsed.page, 10) : undefined,
    limit: parsed.limit ? parseInt(parsed.limit, 10) : undefined,
  };
};
