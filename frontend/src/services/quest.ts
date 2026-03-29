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
    return await apiGet<Quest>(`/quests/${id}`);
  },

  // Create new quest (admin only)
  createQuest: async (data: CreateQuestData): Promise<Quest> => {
    return await apiPost<Quest>('/quests', data);
  },

  // Update quest (admin only)
  updateQuest: async (id: string, data: UpdateQuestData): Promise<Quest> => {
    return await apiPut<Quest>(`/quests/${id}`, data);
  },

  // Delete quest (admin only)
  deleteQuest: async (id: string): Promise<void> => {
    await apiDelete<void>(`/quests/${id}`);
  },

  // Toggle quest active status (admin only)
  toggleQuestStatus: async (id: string): Promise<Quest> => {
    return await apiPut<Quest>(`/quests/${id}/toggle`);
  },

  // Get quest categories
  getCategories: async (): Promise<string[]> => {
    return await apiGet<string[]>('/quests/categories');
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
    return await apiGet<Quest[]>(`/quests/recommended?limit=${limit}`);
  },

  // Get popular quests
  getPopularQuests: async (limit: number = 5): Promise<Quest[]> => {
    return await apiGet<Quest[]>(`/quests/popular?limit=${limit}`);
  },

  // Get latest quests
  getLatestQuests: async (limit: number = 5): Promise<Quest[]> => {
    return await apiGet<Quest[]>(`/quests/latest?limit=${limit}`);
  },
};
