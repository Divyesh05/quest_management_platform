export interface IRewardResponse {
  id: string;
  userId: string;
  questId: string | null;
  type: string;
  points: number;
  description: string;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
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
  } | null;
}

export interface ICreateRewardData {
  userId: string;
  questId?: string;
  type: 'quest_completion' | 'bonus' | 'streak' | 'achievement' | 'referral';
  points: number;
  description: string;
  metadata?: any;
}

export interface IUpdateRewardData {
  type?: 'quest_completion' | 'bonus' | 'streak' | 'achievement' | 'referral';
  points?: number;
  description?: string;
  metadata?: any;
}

export interface IRewardFilters {
  page?: number;
  limit?: number;
  userId?: string;
  type?: 'quest_completion' | 'bonus' | 'streak' | 'achievement' | 'referral';
  questId?: string;
}

export interface IRewardStats {
  totalRewards: number;
  totalPointsAwarded: number;
  rewardsByType: Record<string, number>;
  rewardsByUser: {
    user: {
      id: string;
      email: string;
      points: number;
    };
    rewardCount: number;
    totalPoints: number;
  }[];
  rewardsByQuest: {
    quest: {
      id: string;
      title: string;
      category: string;
      difficulty: string;
    };
    rewardCount: number;
    totalPoints: number;
  }[];
  recentRewards: IRewardResponse[];
}

export interface IRewardService {
  createReward(data: ICreateRewardData): Promise<IRewardResponse>;
  getRewardById(rewardId: string): Promise<IRewardResponse>;
  updateReward(rewardId: string, data: IUpdateRewardData): Promise<IRewardResponse>;
  deleteReward(rewardId: string): Promise<void>;
  getUserRewards(userId: string, filters?: IRewardFilters): Promise<{
    rewards: IRewardResponse[];
    total: number;
    page: number;
    totalPages: number;
  }>;
  getAllRewards(filters?: IRewardFilters): Promise<{
    rewards: IRewardResponse[];
    total: number;
    page: number;
    totalPages: number;
  }>;
  getRewardStats(timeRange?: 'week' | 'month' | 'year' | 'all'): Promise<IRewardStats>;
  awardQuestReward(userId: string, questId: string, bonusPoints?: number): Promise<IRewardResponse>;
  awardBonusReward(userId: string, points: number, description: string, metadata?: any): Promise<IRewardResponse>;
  awardStreakReward(userId: string, streakCount: number, points: number): Promise<IRewardResponse>;
}

export interface IRewardController {
  createReward(req: any, res: any, next: any): Promise<void>;
  getRewardById(req: any, res: any, next: any): Promise<void>;
  updateReward(req: any, res: any, next: any): Promise<void>;
  deleteReward(req: any, res: any, next: any): Promise<void>;
  getUserRewards(req: any, res: any, next: any): Promise<void>;
  getAllRewards(req: any, res: any, next: any): Promise<void>;
  getRewardStats(req: any, res: any, next: any): Promise<void>;
  awardQuestReward(req: any, res: any, next: any): Promise<void>;
  awardBonusReward(req: any, res: any, next: any): Promise<void>;
  awardStreakReward(req: any, res: any, next: any): Promise<void>;
}
