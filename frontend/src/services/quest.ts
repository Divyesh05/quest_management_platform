import { apiGet, apiPost, apiPut, apiDelete } from './api';
import { Quest, CreateQuestData, UpdateQuestData, QuestFilters, PaginatedResponse } from '@/types';

export const questService = {
  // Get all quests with filters
  getQuests: async (filters?: QuestFilters): Promise<PaginatedResponse<Quest>> => {
    const params = new URLSearchParams();
    
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.difficulty) params.append('difficulty', filters.difficulty);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());

    const queryString = params.toString();
    const url = `/quests${queryString ? `?${queryString}` : ''}`;
    
    return await apiGet<PaginatedResponse<Quest>>(url);
  },

  // Get quest by ID
  getQuestById: async (id: string): Promise<Quest> => {
    const response = await apiGet<{ success: boolean; data: Quest }>(`/quests/${id}`);
    return response.data;
  },

  // Create new quest (admin only)
  createQuest: async (data: CreateQuestData): Promise<Quest> => {
    const response = await apiPost<{ success: boolean; data: Quest }>('/quests', data);
    return response.data;
  },

  // Update quest (admin only)
  updateQuest: async (id: string, data: UpdateQuestData): Promise<Quest> => {
    const response = await apiPut<{ success: boolean; data: Quest }>(`/quests/${id}`, data);
    return response.data;
  },

  // Delete quest (admin only)
  deleteQuest: async (id: string): Promise<void> => {
    await apiDelete<void>(`/quests/${id}`);
  },

  // Toggle quest active status (admin only)
  toggleQuestStatus: async (id: string): Promise<Quest> => {
    const response = await apiPut<{ success: boolean; data: Quest }>(`/quests/${id}/toggle`);
    return response.data;
  },

  // Get quest categories
  getCategories: async (): Promise<string[]> => {
    const response = await apiGet<{ success: boolean; data: string[] }>('/quests/categories');
    return response.data;
  },

  // Get quest statistics
  getQuestStats: async (): Promise<{
    total: number;
    active: number;
    inactive: number;
    byCategory: Record<string, number>;
    byDifficulty: Record<string, number>;
  }> => {
    return await apiGet('/quests/stats');
  },

  // Get user's available quests
  getAvailableQuests: async (filters?: QuestFilters): Promise<PaginatedResponse<Quest>> => {
    const params = new URLSearchParams();
    
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.difficulty) params.append('difficulty', filters.difficulty);

    const queryString = params.toString();
    const url = `/quests/available${queryString ? `?${queryString}` : ''}`;
    
    return await apiGet<PaginatedResponse<Quest>>(url);
  },

  // Get user's completed quests
  getCompletedQuests: async (filters?: QuestFilters): Promise<PaginatedResponse<Quest>> => {
    const params = new URLSearchParams();
    
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.difficulty) params.append('difficulty', filters.difficulty);

    const queryString = params.toString();
    const url = `/quests/completed${queryString ? `?${queryString}` : ''}`;
    
    return await apiGet<PaginatedResponse<Quest>>(url);
  },

  // Get user's in-progress quests
  getInProgressQuests: async (filters?: QuestFilters): Promise<PaginatedResponse<Quest>> => {
    const params = new URLSearchParams();
    
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.difficulty) params.append('difficulty', filters.difficulty);

    const queryString = params.toString();
    const url = `/quests/in-progress${queryString ? `?${queryString}` : ''}`;
    
    return await apiGet<PaginatedResponse<Quest>>(url);
  },

  // Search quests
  searchQuests: async (query: string, filters?: QuestFilters): Promise<PaginatedResponse<Quest>> => {
    const searchFilters = { ...filters, search: query };
    return await questService.getQuests(searchFilters);
  },

  // Get recommended quests for user
  getRecommendedQuests: async (limit: number = 5): Promise<Quest[]> => {
    const response = await apiGet<{ success: boolean; data: Quest[] }>(`/quests/recommended?limit=${limit}`);
    return response.data;
  },

  // Get popular quests
  getPopularQuests: async (limit: number = 5): Promise<Quest[]> => {
    const response = await apiGet<{ success: boolean; data: Quest[] }>(`/quests/popular?limit=${limit}`);
    return response.data;
  },

  // Get latest quests
  getLatestQuests: async (limit: number = 5): Promise<Quest[]> => {
    const response = await apiGet<{ success: boolean; data: Quest[] }>(`/quests/latest?limit=${limit}`);
    return response.data;
  },
};
