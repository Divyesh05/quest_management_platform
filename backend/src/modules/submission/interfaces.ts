export interface ISubmissionResponse {
  id: string;
  userId: string;
  questId: string;
  status: 'pending' | 'approved' | 'rejected';
  content?: string;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  feedback?: string;
  user: {
    id: string;
    email: string;
    role: string;
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

export interface ICreateSubmissionData {
  questId: string;
  content: string;
  userId: string;
}

export interface IUpdateSubmissionData {
  content?: string;
  status?: 'pending' | 'approved' | 'rejected';
  feedback?: string;
  reviewedBy?: string;
}

export interface ISubmissionFilters {
  page?: number;
  limit?: number;
  status?: string;
  questId?: string;
  userId?: string;
}

export interface IPaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ISubmissionStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  byQuest: Record<string, number>;
  byUser: Record<string, number>;
}

export interface ISubmissionService {
  createSubmission(data: ICreateSubmissionData): Promise<ISubmissionResponse>;
  getSubmissionById(submissionId: string): Promise<ISubmissionResponse>;
  updateSubmission(submissionId: string, data: IUpdateSubmissionData): Promise<ISubmissionResponse>;
  getUserSubmissions(userId: string, filters?: ISubmissionFilters): Promise<{
    submissions: ISubmissionResponse[];
    total: number;
    page: number;
    totalPages: number;
  }>;
  getAllSubmissions(filters?: ISubmissionFilters): Promise<{
    submissions: ISubmissionResponse[];
    total: number;
    page: number;
    totalPages: number;
  }>;
  deleteSubmission(submissionId: string, userId?: string): Promise<void>;
  getSubmissionStats(): Promise<ISubmissionStats>;
}

export interface ISubmissionController {
  createSubmission(req: any, res: any, next: any): Promise<void>;
  getSubmissionById(req: any, res: any, next: any): Promise<void>;
  updateSubmission(req: any, res: any, next: any): Promise<void>;
  getUserSubmissions(req: any, res: any, next: any): Promise<void>;
  getAllSubmissions(req: any, res: any, next: any): Promise<void>;
  deleteSubmission(req: any, res: any, next: any): Promise<void>;
  approveSubmission(req: any, res: any, next: any): Promise<void>;
  rejectSubmission(req: any, res: any, next: any): Promise<void>;
  getSubmissionStats(req: any, res: any, next: any): Promise<void>;
}
