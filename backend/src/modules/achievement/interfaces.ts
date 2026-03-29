export interface IAchievementResponse {
  id: string;
  userId: string;
  questId: string;
  earnedAt: Date;
  user: {
    id: string;
    email: string;
    role: string;
    points: number;
  };
  quest: {
    id: string;
    title: string;
    description: string;
    reward: number;
    difficulty: string;
    category: string;
  };
}

export interface IAchievementFilters {
  page?: number;
  limit?: number;
  userId?: string;
  category?: string;
  difficulty?: string;
}

export interface ILeaderboardFilters {
  page?: number;
  limit?: number;
  category?: string;
  difficulty?: string;
  timeRange?: 'all' | 'week' | 'month' | 'year';
}

export interface ILeaderboardEntry {
  user: {
    id: string;
    email: string;
    points: number;
  };
  achievementCount: number;
  totalReward: number;
}

export interface IUserAchievementStats {
  totalAchievements: number;
        totalReward: number;
        byCategory: Record<string, number>;
        byDifficulty: Record<string, number>;
        recentAchievements: IAchievementResponse[];
}

export interface IGlobalAchievementStats {
  totalAchievements: number;
  totalUsers: number;
  averageAchievementsPerUser: number;
  totalRewardDistributed: number;
        byCategory: Record<string, number>;
        byDifficulty: Record<string, { count: number; totalReward: number }>;
        topQuests: {
          quest: {
            id: string;
            title: string;
            reward: number;
            category: string;
            difficulty: string;
          };
          achievementCount: number;
          totalReward: number;
          completionRate: number;
        }[];
}

export interface IAchievementService {
  getUserAchievements(userId: string, filters?: IAchievementFilters): Promise<{
    achievements: IAchievementResponse[];
    total: number;
    page: number;
    totalPages: number;
  }>;
  getAchievementById(achievementId: string): Promise<IAchievementResponse>;
  getAllAchievements(filters?: IAchievementFilters): Promise<{
    achievements: IAchievementResponse[];
    total: number;
    page: number;
    totalPages: number;
  }>;
  getLeaderboard(filters?: ILeaderboardFilters): Promise<{
    leaderboard: ILeaderboardEntry[];
    total: number;
    page: number;
    totalPages: number;
  }>;
  getUserAchievementStats(userId: string): Promise<IUserAchievementStats>;
  getGlobalAchievementStats(): Promise<IGlobalAchievementStats>;
  deleteAchievement(achievementId: string, requestingUserId?: string): Promise<void>;
}

export interface IAchievementController {
  getUserAchievements(req: any, res: any, next: any): Promise<void>;
  getAchievementById(req: any, res: any, next: any): Promise<void>;
  getAllAchievements(req: any, res: any, next: any): Promise<void>;
  getLeaderboard(req: any, res: any, next: any): Promise<void>;
  getUserAchievementStats(req: any, res: any, next: any): Promise<void>;
  getGlobalAchievementStats(req: any, res: any, next: any): Promise<void>;
  deleteAchievement(req: any, res: any, next: any): Promise<void>;
}
