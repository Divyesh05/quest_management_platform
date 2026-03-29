import { Request, Response, NextFunction } from 'express';

export class RewardError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'RewardError';
  }
}

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const canUserAccessReward = (rewardUserId: string, requestingUserId: string, userRole: string): boolean => {
  return rewardUserId === requestingUserId || userRole === 'admin';
};

export const canUserModifyReward = (rewardUserId: string, requestingUserId: string, userRole: string): boolean => {
  return userRole === 'admin'; // Only admins can modify rewards
};

export const calculateRewardMultiplier = (baseReward: number, difficulty: string, streakBonus: number = 0): number => {
  const difficultyMultiplier = {
    easy: 1.0,
    medium: 1.5,
    hard: 2.0
  }[difficulty] || 1.0;

  return Math.round(baseReward * difficultyMultiplier + streakBonus);
};

export const validateRewardPoints = (points: number, type: string): boolean => {
  const maxPoints = {
    quest_completion: 1000,
    bonus: 500,
    streak: 200,
    achievement: 300,
    referral: 100
  }[type] || 500;

  return points > 0 && points <= maxPoints;
};

export const formatRewardResponse = (reward: any) => {
  return {
    ...reward,
    createdAt: new Date(reward.createdAt).toISOString(),
    updatedAt: new Date(reward.updatedAt).toISOString()
  };
};

export const getRewardTypeLabel = (type: string): string => {
  const labels = {
    quest_completion: 'Quest Completion',
    bonus: 'Bonus Reward',
    streak: 'Streak Bonus',
    achievement: 'Achievement Reward',
    referral: 'Referral Bonus'
  };

  return labels[type as keyof typeof labels] || type;
};

export const calculateStreakBonus = (streakCount: number): number => {
  if (streakCount >= 30) return 100; // 30+ days
  if (streakCount >= 14) return 50;  // 14+ days
  if (streakCount >= 7) return 25;   // 7+ days
  if (streakCount >= 3) return 10;   // 3+ days
  return 0;
};
