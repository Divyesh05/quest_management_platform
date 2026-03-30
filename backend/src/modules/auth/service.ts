import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../lib/prisma';
import { IAuthService, ILoginData, IRegisterData, IAuthResponse } from './interfaces';
import { AuthError } from './utils';

export class AuthService implements IAuthService {
  private validateJwtSecret(): void {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required');
    }
  }

  async register(data: IRegisterData): Promise<IAuthResponse> {
    this.validateJwtSecret();
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
    this.validateJwtSecret();
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
    this.validateJwtSecret();
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      return { userId: decoded.userId, role: decoded.role };
    } catch (error) {
      throw new AuthError('Invalid token', 401);
    }
  }

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        points: true,
        createdAt: true
      }
    });
    return user;
  }

  async updateUser(userId: string, data: { email?: string; role?: string }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        role: true,
        points: true,
        createdAt: true
      }
    });
    return user;
  }

  async getAllUsers() {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        points: true,
        createdAt: true
      }
    });
    return users;
  }

  async updateUserRole(userId: string, role: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true,
        points: true,
        createdAt: true
      }
    });
    return user;
  }

  async deleteUser(userId: string) {
    await prisma.user.delete({
      where: { id: userId }
    });
  }

  private generateToken(userId: string, role: string): string {
    this.validateJwtSecret();
    return jwt.sign(
      { userId, role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );
  }
}
