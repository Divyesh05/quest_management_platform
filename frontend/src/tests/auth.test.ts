import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '@/services/auth';

const mockApiPost = vi.fn();

vi.mock('@/services/api', () => ({
  apiPost: (...args: any[]) => mockApiPost(...args),
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('login saves token and user', async () => {
    const mockUser = { id: '1', email: 'test@test.com' };
    const mockResponse = { success: true, data: { user: mockUser, token: 'token123' } };
    mockApiPost.mockResolvedValueOnce(mockResponse);

    const result = await authService.login('test@test.com', 'password');

    expect(result).toEqual(mockResponse);
    expect(localStorage.getItem('token')).toBe('token123');
  });

  it('logout removes token and user', () => {
    localStorage.setItem('token', 'token123');
    authService.logout();
    expect(localStorage.getItem('token')).toBeNull();
  });
});
