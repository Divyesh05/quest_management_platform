// Auth Types
export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  points: number;
  createdAt: string;
  updatedAt: string;
  name?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  role?: 'user' | 'admin';
}

// Quest Types
export interface Quest {
  id: string;
  title: string;
  description: string;
  reward: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  createdByUser?: {
    id: string;
    email: string;
  };
}

export interface CreateQuestData {
  title: string;
  description: string;
  reward: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
}

export interface UpdateQuestData {
  title?: string;
  description?: string;
  reward?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  category?: string;
  isActive?: boolean;
}

export interface QuestFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  isActive?: boolean;
}

// Submission Types
export interface Submission {
  id: string;
  userId: string;
  questId: string;
  status: 'pending' | 'approved' | 'rejected';
  content?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  feedback?: string;
  user: User;
  quest: Quest;
}

export interface CreateSubmissionData {
  questId: string;
  content?: string;
}

export interface UpdateSubmissionData {
  status?: 'pending' | 'approved' | 'rejected';
  feedback?: string;
}

export interface SubmissionFilters {
  page?: number;
  limit?: number;
  userId?: string;
  questId?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

// Achievement Types
export interface Achievement {
  id: string;
  userId: string;
  questId: string;
  earnedAt: string;
  user: User;
  quest: Quest;
}

export interface AchievementFilters {
  page?: number;
  limit?: number;
  userId?: string;
  questId?: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  timeRange?: 'all' | 'week' | 'month' | 'year';
}

// Reward Types
export interface Reward {
  id: string;
  userId: string;
  questId?: string;
  type: 'quest_completion' | 'bonus' | 'streak' | 'achievement' | 'referral';
  points: number;
  description: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  user: User;
  quest?: Quest;
}

export interface CreateRewardData {
  userId: string;
  questId?: string;
  type: 'quest_completion' | 'bonus' | 'streak' | 'achievement' | 'referral';
  points: number;
  description: string;
  metadata?: any;
}

export interface RewardFilters {
  page?: number;
  limit?: number;
  userId?: string;
  type?: 'quest_completion' | 'bonus' | 'streak' | 'achievement' | 'referral';
  questId?: string;
}

// Leaderboard Types
export interface LeaderboardEntry {
  rank: number;
  user: User;
  achievementCount: number;
  totalReward: number;
  averageReward: number;
  rankChange: number;
  badges: string[];
}

export interface LeaderboardFilters {
  page?: number;
  limit?: number;
  timeRange?: 'all' | 'week' | 'month' | 'year';
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface QuestLeaderboardEntry {
  user: User;
  submission: {
    id: string;
    submittedAt: string;
    status: string;
    feedback?: string;
  };
  rank: number;
  timeToComplete?: number;
}

// Dashboard Types
export interface DashboardStats {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalQuests: number;
    activeQuests: number;
    totalSubmissions: number;
    pendingSubmissions: number;
    approvedSubmissions: number;
    rejectedSubmissions: number;
    totalAchievements: number;
    totalPointsAwarded: number;
    approvalRate: number;
  };
  topUsers: LeaderboardEntry[];
  questStats: any[];
  recentActivity: any[];
  trends: {
    submissions: any[];
    achievements: any[];
  };
  timeRange: 'all' | 'week' | 'month' | 'year';
}

export interface UserDashboardStats {
  overview: {
    totalSubmissions: number;
    approvedSubmissions: number;
    rejectedSubmissions: number;
    pendingSubmissions: number;
    totalAchievements: number;
    totalPoints: number;
    approvalRate: number;
  };
  recentActivity: any[];
  progressByCategory: Record<string, {
    completed: number;
    total: number;
    percentage: number;
  }>;
  progressByDifficulty: Record<string, {
    completed: number;
    total: number;
    percentage: number;
  }>;
  monthlyProgress: any[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

// Common Types
export interface SelectOption {
  value: string;
  label: string;
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface FilterOption {
  key: string;
  label: string;
  value: any;
  type: 'select' | 'text' | 'date' | 'number';
  options?: SelectOption[];
}

// UI State Types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SortState {
  key: string;
  direction: 'asc' | 'desc';
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'number';
  placeholder?: string;
  required?: boolean;
  options?: SelectOption[];
  validation?: any;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

// Chart Types
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}
