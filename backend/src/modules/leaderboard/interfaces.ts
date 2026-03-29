export interface ILeaderboardEntry {
  rank: number;
  user: {
    id: string;
    email: string;
    points: number;
    createdAt: Date;
  };
  achievementCount: number;
  totalReward: number;
  averageReward: number;
  rankChange: number;
  badges: string[];
}

export interface ILeaderboardFilters {
  page?: number;
  limit?: number;
  timeRange?: 'all' | 'week' | 'month' | 'year';
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface ILeaderboardStats {
  totalUsers: number;
  activeUsers: number;
  totalAchievements: number;
  totalPointsAwarded: number;
  topPerformers: {
    user: {
      id: string;
      email: string;
      points: number;
    };
    rank: number;
    achievementCount: number;
    totalReward: number;
  }[];
  categoryStats: {
    category: string;
    count: number;
    totalReward: number;
  }[];
  difficultyStats: {
    difficulty: string;
    count: number;
    totalReward: number;
  }[];
  recentActivity: {
    type: 'achievement';
    user: {
      id: string;
      email: string;
    };
    quest: {
      title: string;
      category: string;
      difficulty: string;
      reward: number;
    };
    timestamp: Date;
  }[];
  timeRange: 'all' | 'week' | 'month' | 'year';
}

export interface IQuestLeaderboardEntry {
  user: {
    id: string;
    email: string;
    points: number;
  };
  submission: {
    id: string;
    submittedAt: Date;
    status: string;
    feedback?: string;
  };
  rank: number;
  timeToComplete?: number;
}

export interface ICategoryLeaderboard {
  category: string;
  leaderboard: ILeaderboardEntry[];
  totalParticipants: number;
}

export interface IUserRanking {
  globalRank: number;
  categoryRanks: Record<string, number>;
  difficultyRanks: Record<string, number>;
  totalParticipants: number;
  badges: string[];
}

export interface ILeaderboardService {
  getGlobalLeaderboard(filters?: ILeaderboardFilters): Promise<{
    leaderboard: ILeaderboardEntry[];
    total: number;
    page: number;
    totalPages: number;
  }>;
  getUserLeaderboard(userId: string, filters?: ILeaderboardFilters): Promise<{
    leaderboard: ILeaderboardEntry[];
    userRank: {
      rank: number;
      entry: ILeaderboardEntry;
    };
    nearbyUsers: ILeaderboardEntry[];
  }>;
  getQuestLeaderboard(questId: string, filters?: ILeaderboardFilters): Promise<{
    leaderboard: IQuestLeaderboardEntry[];
    quest: {
      id: string;
      title: string;
      description: string;
      difficulty: string;
      category: string;
      reward: number;
    };
    stats: {
      totalSubmissions: number;
      approvedSubmissions: number;
      averageTimeToComplete: number;
      completionRate: number;
    };
  }>;
  getCategoryLeaderboards(timeRange?: 'all' | 'week' | 'month' | 'year'): Promise<{
    categories: ICategoryLeaderboard[];
  }>;
  getLeaderboardStats(timeRange?: 'all' | 'week' | 'month' | 'year'): Promise<ILeaderboardStats>;
  getUserRanking(userId: string, timeRange?: 'all' | 'week' | 'month' | 'year'): Promise<IUserRanking>;
}

export interface ILeaderboardController {
  getGlobalLeaderboard(req: any, res: any, next: any): Promise<void>;
  getUserLeaderboard(req: any, res: any, next: any): Promise<void>;
  getQuestLeaderboard(req: any, res: any, next: any): Promise<void>;
  getCategoryLeaderboards(req: any, res: any, next: any): Promise<void>;
  getLeaderboardStats(req: any, res: any, next: any): Promise<void>;
  getUserRanking(req: any, res: any, next: any): Promise<void>;
}
