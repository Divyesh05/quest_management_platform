export interface IUserResponse {
  id: string;
  email: string;
  role: string;
  points: number;
  createdAt: Date;
}

export interface IUpdateUserData {
  email?: string;
  role?: string;
}

export interface IPointsOperation {
  points: number;
}

export interface IPaginationResult {
  users: IUserResponse[];
  total: number;
  page: number;
  totalPages: number;
}

export interface IUserService {
  getUserById(userId: string): Promise<IUserResponse>;
  updateUser(userId: string, data: IUpdateUserData): Promise<IUserResponse>;
  addPoints(userId: string, points: number): Promise<IUserResponse>;
  deductPoints(userId: string, points: number): Promise<IUserResponse>;
  getAllUsers(page: number, limit: number): Promise<IPaginationResult>;
  deleteUser(userId: string): Promise<void>;
}

export interface IUserController {
  getProfile(req: any, res: any, next: any): Promise<void>;
  updateProfile(req: any, res: any, next: any): Promise<void>;
  getUserById(req: any, res: any, next: any): Promise<void>;
  updateUser(req: any, res: any, next: any): Promise<void>;
  addPoints(req: any, res: any, next: any): Promise<void>;
  deductPoints(req: any, res: any, next: any): Promise<void>;
  getAllUsers(req: any, res: any, next: any): Promise<void>;
  deleteUser(req: any, res: any, next: any): Promise<void>;
}
