export interface IQuestResponse {
  id: string;
  title: string;
  description: string;
  reward: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: string;
}

export interface ICreateQuestData {
  title: string;
  description: string;
  reward: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
  isActive?: boolean;
  createdBy: string;
}

export interface IUpdateQuestData {
  title?: string;
  description?: string;
  reward?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
  isActive?: boolean;
}

export interface IQuestFilters {
  page?: number;
  limit?: number;
  difficulty?: string;
  category?: string;
  isActive?: boolean;
  search?: string;
}

export interface IPaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface IQuestStats {
  total: number;
  active: number;
  inactive: number;
  byDifficulty: Record<string, number>;
  byCategory: Record<string, number>;
}

export interface IQuestService {
  createQuest(data: ICreateQuestData): Promise<IQuestResponse>;
  getQuestById(questId: string): Promise<IQuestResponse>;
  updateQuest(questId: string, data: IUpdateQuestData): Promise<IQuestResponse>;
  deleteQuest(questId: string): Promise<void>;
  getAllQuests(filters?: IQuestFilters): Promise<{
    quests: IQuestResponse[];
    total: number;
    page: number;
    totalPages: number;
  }>;
  getActiveQuests(page?: number, limit?: number): Promise<{
    quests: IQuestResponse[];
    total: number;
    page: number;
    totalPages: number;
  }>;
  getQuestsByCategory(category: string, page?: number, limit?: number): Promise<{
    quests: IQuestResponse[];
    total: number;
    page: number;
    totalPages: number;
  }>;
  getQuestsByDifficulty(difficulty: string, page?: number, limit?: number): Promise<{
    quests: IQuestResponse[];
    total: number;
    page: number;
    totalPages: number;
  }>;
  toggleQuestStatus(questId: string): Promise<IQuestResponse>;
  getQuestStats(): Promise<IQuestStats>;
}

export interface IQuestController {
  createQuest(req: any, res: any, next: any): Promise<void>;
  getQuestById(req: any, res: any, next: any): Promise<void>;
  updateQuest(req: any, res: any, next: any): Promise<void>;
  deleteQuest(req: any, res: any, next: any): Promise<void>;
  getAllQuests(req: any, res: any, next: any): Promise<void>;
  getActiveQuests(req: any, res: any, next: any): Promise<void>;
  getQuestsByCategory(req: any, res: any, next: any): Promise<void>;
  getQuestsByDifficulty(req: any, res: any, next: any): Promise<void>;
  toggleQuestStatus(req: any, res: any, next: any): Promise<void>;
  getQuestStats(req: any, res: any, next: any): Promise<void>;
}
