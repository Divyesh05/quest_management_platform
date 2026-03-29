export type ITimeRangeFilter = 'all' | 'week' | 'month' | 'year';

export interface IDashboardStats {
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
  topUsers: {
    id: string;
    email: string;
    points: number;
    achievementCount: number;
    totalReward: number;
  }[];
  questStats: {
    id: string;
    title: string;
    category: string;
    difficulty: string;
    reward: number;
    totalSubmissions: number;
    approvedSubmissions: number;
    rejectedSubmissions: number;
    totalAchievements: number;
    approvalRate: number;
  }[];
  recentActivity: {
    type: 'submission' | 'achievement';
    id: string;
    user: {
      id: string;
      email: string;
    };
    quest: {
      id: string;
      title: string;
    };
    status?: string;
    reward?: number;
    timestamp: Date;
  }[];
  trends: {
    submissions: {
      date: string;
      total: number;
      approved: number;
      rejected: number;
      pending: number;
    }[];
    achievements: {
      date: string;
      total: number;
      byCategory: Record<string, number>;
      byDifficulty: Record<string, number>;
    }[];
  };
  timeRange: ITimeRangeFilter;
}

export interface IUserDashboardStats {
  overview: {
    totalSubmissions: number;
    approvedSubmissions: number;
    rejectedSubmissions: number;
    pendingSubmissions: number;
    totalAchievements: number;
    totalPoints: number;
    approvalRate: number;
  };
  recentActivity: {
    type: 'submission' | 'achievement';
    quest: {
      id: string;
      title: string;
    };
    status?: string;
    reward?: number;
    timestamp: Date;
  }[];
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
  monthlyProgress: {
    month: string;
    achievements: number;
    points: number;
  }[];
}

export interface IQuestAnalytics {
  quest: {
    id: string;
    title: string;
    description: string;
    reward: number;
    difficulty: string;
    category: string;
    isActive: boolean;
  };
  stats: {
    totalSubmissions: number;
    approvedSubmissions: number;
    rejectedSubmissions: number;
    pendingSubmissions: number;
    approvalRate: number;
    totalAchievements: number;
    completionRate: number;
    averageTimeToComplete: number;
  };
  trends: {
    date: string;
    total: number;
    approved: number;
    rejected: number;
    pending: number;
  }[];
  topPerformers: {
    user: {
      id: string;
      email: string;
    };
    submittedAt: Date;
    status: string;
  }[];
}

export interface IDashboardService {
  getDashboardStats(timeRange?: ITimeRangeFilter): Promise<IDashboardStats>;
  getUserDashboardStats(userId: string, timeRange?: ITimeRangeFilter): Promise<IUserDashboardStats>;
  getQuestAnalytics(questId: string, timeRange?: ITimeRangeFilter): Promise<IQuestAnalytics>;
}

export interface IDashboardController {
  getDashboardStats(req: any, res: any, next: any): Promise<void>;
  getUserDashboardStats(req: any, res: any, next: any): Promise<void>;
  getQuestAnalytics(req: any, res: any, next: any): Promise<void>;
}
