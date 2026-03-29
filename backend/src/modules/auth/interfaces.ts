export interface IUser {
  id: string;
  email: string;
  role: string;
  points: number;
  createdAt: Date;
}

export interface IAuthResponse {
  user: Omit<IUser, 'createdAt'>;
  token: string;
}

export interface IRegisterData {
  email: string;
  password: string;
  role?: string;
}

export interface ILoginData {
  email: string;
  password: string;
}

export interface IAuthService {
  register(data: IRegisterData): Promise<IAuthResponse>;
  login(data: ILoginData): Promise<IAuthResponse>;
  validateToken(token: string): Promise<{ userId: string; role: string }>;
}

export interface IAuthController {
  register(req: any, res: any, next: any): Promise<void>;
  login(req: any, res: any, next: any): Promise<void>;
  getProfile(req: any, res: any, next: any): Promise<void>;
}
