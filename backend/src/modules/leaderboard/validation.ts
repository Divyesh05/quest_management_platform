import { z } from 'zod';
import { ILeaderboardFilters } from './interfaces';

export const leaderboardFiltersSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().positive().default(1)),
  limit: z.string().transform(Number).pipe(z.number().positive().max(100).default(50)),
  timeRange: z.enum(['all', 'week', 'month', 'year']).default('all'),
  category: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional()
});

export const validateLeaderboardFilters = (query: unknown): ILeaderboardFilters => {
  return leaderboardFiltersSchema.parse(query);
};
