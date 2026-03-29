import { apiPost, apiGet, apiPut } from './api';
import { AuthResponse, LoginData, RegisterData, User } from '@/types';

export const authService = {
  // Login user
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await apiPost<AuthResponse>('/auth/login', data);
    
    // Store token and user in localStorage
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    return response;
  },

  // Register new user
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiPost<AuthResponse>('/auth/register', data);
    
    // Store token and user in localStorage
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    return response;
  },

  // Logout user
  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    return await apiGet<User>('/auth/me');
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // Get stored user
  getStoredUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Get stored token
  getStoredToken: (): string | null => {
    return localStorage.getItem('token');
  },

  // Update user profile
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiPut<User>('/auth/profile', data);
    
    // Update stored user
    localStorage.setItem('user', JSON.stringify(response));
    
    return response;
  },

  // Change password
  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
    await apiPost<void>('/auth/change-password', data);
  },

  // Forgot password
  forgotPassword: async (email: string): Promise<void> => {
    await apiPost<void>('/auth/forgot-password', { email });
  },

  // Reset password
  resetPassword: async (data: { token: string; newPassword: string }): Promise<void> => {
    await apiPost<void>('/auth/reset-password', data);
  },

  // Refresh token
  refreshToken: async (): Promise<AuthResponse> => {
    const response = await apiPost<AuthResponse>('/auth/refresh');
    
    // Update stored token
    localStorage.setItem('token', response.token);
    
    return response;
  },
};
