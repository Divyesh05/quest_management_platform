import { apiGet } from './api';
import { Achievement, AchievementFilters, PaginatedResponse } from '@/types';

export const achievementService = {
  // Get all achievements (admin only)
  getAchievements: async (filters?: AchievementFilters): Promise<PaginatedResponse<Achievement>> => {
    const params = new URLSearchParams();
    
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.questId) params.append('questId', filters.questId);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.difficulty) params.append('difficulty', filters.difficulty);
    if (filters?.timeRange) params.append('timeRange', filters.timeRange);

    const queryString = params.toString();
    const url = `/achievements${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiGet<{
      achievements: Achievement[];
      total: number;
      page: number;
      totalPages: number;
    }>(url);
    
    return {
      data: response.achievements,
      total: response.total,
      page: response.page,
      totalPages: response.totalPages,
    };
  },

  // Get current user's achievements
  getMyAchievements: async (filters?: AchievementFilters): Promise<PaginatedResponse<Achievement>> => {
    const params = new URLSearchParams();
    
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.category) params.append('category', filters.category);
    if (filters?.difficulty) params.append('difficulty', filters.difficulty);
    if (filters?.timeRange) params.append('timeRange', filters.timeRange);

    const queryString = params.toString();
    const url = `/achievements/my${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiGet<{
      achievements: Achievement[];
      total: number;
      page: number;
      totalPages: number;
    }>(url);
    
    return {
      data: response.achievements,
      total: response.total,
      page: response.page,
      totalPages: response.totalPages,
    };
  },

  // Get achievement by ID
  getAchievementById: async (id: string): Promise<Achievement> => {
    return await apiGet<Achievement>(`/achievements/${id}`);
  },

  // Get achievement statistics
  getAchievementStats: async (): Promise<{
    total: number;
    byCategory: Record<string, number>;
    byDifficulty: Record<string, number>;
    byTimeRange: Record<string, number>;
    recentAchievements: Achievement[];
  }> => {
    return await apiGet('/achievements/stats');
  },

  // Get recent achievements
  getRecentAchievements: async (limit: number = 10): Promise<Achievement[]> => {
    return await apiGet<Achievement[]>(`/achievements/recent?limit=${limit}`);
  },

  // Get user's achievement progress
  getAchievementProgress: async (): Promise<{
    totalAchievements: number;
    unlockedAchievements: number;
    progressPercentage: number;
    nextAchievements: {
      questId: string;
      questTitle: string;
      progress: number;
      required: number;
    }[];
  }> => {
    return await apiGet('/achievements/progress');
  },

  // Get available achievement types
  getAchievementTypes: async (): Promise<string[]> => {
    return await apiGet<string[]>('/achievements/types');
  },
};
