import { Request, Response, NextFunction } from 'express';

export class SubmissionError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'SubmissionError';
  }
}

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const canUserAccessSubmission = (submissionUserId: string, requestingUserId: string, userRole: string): boolean => {
  return submissionUserId === requestingUserId || userRole === 'admin';
};

export const canUserDeleteSubmission = (submissionStatus: string, submissionUserId: string, requestingUserId: string, userRole: string): boolean => {
  if (submissionStatus !== 'pending') return false;
  return submissionUserId === requestingUserId || userRole === 'admin';
};

export const canUserUpdateSubmission = (submissionStatus: string): boolean => {
  return submissionStatus === 'pending';
};

export const validateSubmissionContent = (content: string): boolean => {
  return content.trim().length > 0 && content.length <= 5000;
};

export const formatSubmissionResponse = (submission: any) => {
  return {
    ...submission,
    submittedAt: new Date(submission.submittedAt).toISOString(),
    reviewedAt: submission.reviewedAt ? new Date(submission.reviewedAt).toISOString() : null
  };
};
