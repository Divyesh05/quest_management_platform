import { apiGet, apiPost, apiPut } from './api';
import { Submission, CreateSubmissionData, UpdateSubmissionData, SubmissionFilters, PaginatedResponse } from '@/types';

export const submissionService = {
  // Get all submissions (admin only)
  getSubmissions: async (filters?: SubmissionFilters): Promise<PaginatedResponse<Submission>> => {
    const params = new URLSearchParams();
    
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.questId) params.append('questId', filters.questId);
    if (filters?.status) params.append('status', filters.status);

    const queryString = params.toString();
    const url = `/submissions${queryString ? `?${queryString}` : ''}`;
    
    return await apiGet<PaginatedResponse<Submission>>(url);
  },

  // Get current user's submissions
  getMySubmissions: async (filters?: SubmissionFilters): Promise<PaginatedResponse<Submission>> => {
    const params = new URLSearchParams();
    
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.status) params.append('status', filters.status);

    const queryString = params.toString();
    const url = `/submissions/my${queryString ? `?${queryString}` : ''}`;
    
    return await apiGet<PaginatedResponse<Submission>>(url, undefined, true);
  },

  // Get submission by ID
  getSubmissionById: async (id: string): Promise<Submission> => {
    return await apiGet<Submission>(`/submissions/${id}`);
  },

  // Create new submission
  createSubmission: async (data: CreateSubmissionData): Promise<Submission> => {
    return await apiPost<Submission>('/submissions', data);
  },

  // Update submission (admin only)
  updateSubmission: async (id: string, data: UpdateSubmissionData): Promise<Submission> => {
    return await apiPut<Submission>(`/submissions/${id}`, data);
  },

  // Review submission (admin only)
  reviewSubmission: async (id: string, data: { status: 'approved' | 'rejected'; feedback?: string }): Promise<Submission> => {
    return await apiPut<Submission>(`/submissions/${id}/review`, data);
  },

  // Get submission statistics
  getSubmissionStats: async (): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    approvalRate: number;
    byStatus: Record<string, number>;
    byQuest: Record<string, number>;
    byUser: Record<string, number>;
  }> => {
    return await apiGet('/submissions/stats');
  },

  // Get recent submissions
  getRecentSubmissions: async (limit: number = 10): Promise<Submission[]> => {
    return await apiGet<Submission[]>(`/submissions/recent?limit=${limit}`);
  },

  // Get pending submissions (admin only)
  getPendingSubmissions: async (limit: number = 10): Promise<Submission[]> => {
    return await apiGet<Submission[]>(`/submissions/pending?limit=${limit}`);
  },
};
