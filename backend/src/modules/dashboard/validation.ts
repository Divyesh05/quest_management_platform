import { z } from 'zod';
import { ITimeRangeFilter } from './interfaces';

export const timeRangeFilterSchema = z.object({
  timeRange: z.enum(['all', 'week', 'month', 'year']).default('all')
});

export const validateTimeRangeFilter = (query: unknown): { timeRange: ITimeRangeFilter } => {
  return timeRangeFilterSchema.parse(query);
};
