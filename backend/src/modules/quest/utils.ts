import { Request, Response, NextFunction } from 'express';

export class QuestError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'QuestError';
  }
}

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const calculateQuestDifficulty = (reward: number): 'easy' | 'medium' | 'hard' => {
  if (reward <= 50) return 'easy';
  if (reward <= 150) return 'medium';
  return 'hard';
};

export const validateQuestReward = (reward: number, difficulty: 'easy' | 'medium' | 'hard'): boolean => {
  const rewardRanges = {
    easy: { min: 10, max: 50 },
    medium: { min: 51, max: 150 },
    hard: { min: 151, max: 500 }
  };

  const range = rewardRanges[difficulty];
  return reward >= range.min && reward <= range.max;
};
