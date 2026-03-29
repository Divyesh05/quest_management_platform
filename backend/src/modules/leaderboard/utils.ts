import { Request, Response, NextFunction } from 'express';

export class LeaderboardError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'LeaderboardError';
  }
}

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const calculateRankTiers = (rank: number): string => {
  if (rank === 1) return '🥇 Champion';
  if (rank === 2) return '🥈 Runner-up';
  if (rank === 3) return '🥉 Third Place';
  if (rank <= 10) return '⭐ Top 10';
  if (rank <= 25) return '🌟 Top 25';
  if (rank <= 50) return '💫 Top 50';
  if (rank <= 100) return '✨ Top 100';
  return '🎯 Rising Star';
};

export const formatLeaderboardEntry = (entry: any, rank: number) => {
  return {
    ...entry,
    rank,
    tier: calculateRankTiers(rank),
    formattedReward: `${entry.totalReward.toLocaleString()} points`,
    formattedAchievements: `${entry.achievementCount} achievements`,
    rankChange: entry.rankChange || 0,
    rankChangeLabel: entry.rankChange > 0 ? `↑${entry.rankChange}` : 
                     entry.rankChange < 0 ? `↓${Math.abs(entry.rankChange)}` : '—'
  };
};

export const getBadgeColor = (badge: string): string => {
  const colors: Record<string, string> = {
    'Century Club': '#FFD700',
    'High Achiever': '#C0C0C0',
    'Rising Star': '#CD7F32',
    'Dedicated': '#4169E1',
    'Getting Started': '#32CD32',
    'Elite': '#FF6B6B',
    'Master': '#9B59B6',
    'Expert': '#3498DB',
    'Skilled': '#2ECC71',
    'Novice': '#95A5A6',
    'On Fire': '#FF4500',
    'Consistent': '#FF8C00',
    'Week Warrior': '#FFD700'
  };

  return colors[badge] || '#95A5A6';
};

export const calculatePercentile = (rank: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round(((total - rank) / total) * 100);
};

export const getLeaderboardCacheKey = (filters: any): string => {
  const { page = 1, limit = 50, timeRange = 'all', category, difficulty } = filters;
  return `leaderboard:${page}:${limit}:${timeRange}:${category || 'all'}:${difficulty || 'all'}`;
};

export const isValidTimeRange = (timeRange: string): boolean => {
  return ['all', 'week', 'month', 'year'].includes(timeRange);
};

export const isValidDifficulty = (difficulty: string): boolean => {
  return ['easy', 'medium', 'hard'].includes(difficulty);
};

export const sanitizeCategory = (category: string): string => {
  return category.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
};

export const calculateStreakBonus = (streakDays: number): number => {
  if (streakDays >= 30) return 100;
  if (streakDays >= 14) return 50;
  if (streakDays >= 7) return 25;
  if (streakDays >= 3) return 10;
  return 0;
};

export const getLeaderboardTimeRangeLabel = (timeRange: string): string => {
  const labels = {
    'all': 'All Time',
    'week': 'This Week',
    'month': 'This Month',
    'year': 'This Year'
  };

  return labels[timeRange as keyof typeof labels] || 'All Time';
};

export const formatTimeRange = (timeRange: string): { start: Date; end: Date } => {
  const now = new Date();
  let start: Date;
  
  switch (timeRange) {
    case 'week':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      start = new Date(0);
  }

  return { start, end: now };
};
