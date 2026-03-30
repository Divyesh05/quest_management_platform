import { apiGet } from './api';
import { LeaderboardEntry, LeaderboardFilters, QuestLeaderboardEntry, PaginatedResponse } from '@/types';

export const leaderboardService = {
  // Get main leaderboard
  getLeaderboard: async (filters?: LeaderboardFilters): Promise<PaginatedResponse<LeaderboardEntry>> => {
    const params = new URLSearchParams();
    
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.timeRange) params.append('timeRange', filters.timeRange);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.difficulty) params.append('difficulty', filters.difficulty);

    const queryString = params.toString();
    const url = `/leaderboard${queryString ? `?${queryString}` : ''}`;
    
    return await apiGet<PaginatedResponse<LeaderboardEntry>>(url);
  },

  // Get top users
  getTopUsers: async (limit: number = 10): Promise<LeaderboardEntry[]> => {
    return await apiGet<LeaderboardEntry[]>(`/leaderboard/top/${limit}`);
  },

  // Get quest-specific leaderboard
  getQuestLeaderboard: async (questId: string): Promise<QuestLeaderboardEntry[]> => {
    return await apiGet<QuestLeaderboardEntry[]>(`/leaderboard/quest/${questId}`);
  },

  // Get user's rank
  getUserRank: async (userId?: string): Promise<{
    rank: number;
    totalUsers: number;
    percentile: number;
  }> => {
    const url = userId ? `/leaderboard/rank/${userId}` : '/leaderboard/my-rank';
    return await apiGet(url);
  },

  // Get leaderboard trends
  getLeaderboardTrends: async (timeRange: 'week' | 'month' | 'year' = 'month'): Promise<{
    date: string;
    topUsers: LeaderboardEntry[];
    totalUsers: number;
  }[]> => {
    return await apiGet(`/leaderboard/trends?timeRange=${timeRange}`);
  },

  // Get category rankings
  getCategoryRankings: async (category: string): Promise<LeaderboardEntry[]> => {
    return await apiGet<LeaderboardEntry[]>(`/leaderboard/category/${category}`);
  },

  // Get difficulty rankings
  getDifficultyRankings: async (difficulty: 'easy' | 'medium' | 'hard'): Promise<LeaderboardEntry[]> => {
    return await apiGet<LeaderboardEntry[]>(`/leaderboard/difficulty/${difficulty}`);
  },
};
