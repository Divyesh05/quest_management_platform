import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { IAuthService, ILoginData, IRegisterData, IAuthResponse } from '../interfaces';
import { AuthError } from '../utils';

const prisma = new PrismaClient();

export class AuthService implements IAuthService {
  async register(data: IRegisterData): Promise<IAuthResponse> {
    const { email, password, role = 'user' } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new AuthError('User already exists', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role
      }
    });

    // Generate JWT token
    const token = this.generateToken(user.id, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        points: user.points
      },
      token
    };
  }

  async login(data: ILoginData): Promise<IAuthResponse> {
    const { email, password } = data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new AuthError('Invalid credentials', 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AuthError('Invalid credentials', 401);
    }

    // Generate JWT token
    const token = this.generateToken(user.id, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        points: user.points
      },
      token
    };
  }

  async validateToken(token: string): Promise<{ userId: string; role: string }> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      return { userId: decoded.userId, role: decoded.role };
    } catch (error) {
      throw new AuthError('Invalid token', 401);
    }
  }

  private generateToken(userId: string, role: string): string {
    return jwt.sign(
      { userId, role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );
  }
}
