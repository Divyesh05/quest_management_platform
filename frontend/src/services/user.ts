import { apiGet, apiPut, apiDelete } from './api';

export interface User {
  id: string;
  email: string;
  role: string;
  points: number;
  createdAt: string;
}

export interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const userService = {
  // Get all users (admin only)
  async getUsers(params?: { page?: number; limit?: number }): Promise<UsersResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await apiGet(`/users?${queryParams.toString()}`) as ApiResponse<UsersResponse>;
    return response.data;
  },

  // Get user by ID (admin only)
  async getUserById(userId: string): Promise<User> {
    const response = await apiGet(`/users/${userId}`) as ApiResponse<User>;
    return response.data;
  },

  // Update user (admin only)
  async updateUser(userId: string, data: Partial<User>): Promise<User> {
    const response = await apiPut(`/users/${userId}`, data) as ApiResponse<User>;
    return response.data;
  },

  // Delete user (admin only)
  async deleteUser(userId: string): Promise<void> {
    await apiDelete(`/users/${userId}`);
  },

  // Add points to user (admin only)
  async addPoints(userId: string, points: number): Promise<User> {
    const response = await apiPut(`/users/${userId}/points`, { points }) as ApiResponse<User>;
    return response.data;
  },

  // Deduct points from user (admin only)
  async deductPoints(userId: string, points: number): Promise<User> {
    const response = await apiPut(`/users/${userId}/points/deduct`, { points }) as ApiResponse<User>;
    return response.data;
  }
};
