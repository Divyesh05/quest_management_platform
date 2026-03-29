import { PrismaClient } from '@prisma/client';
import { IUserService, IUpdateUserData, IUserResponse } from '../interfaces';
import { UserError } from '../utils';

const prisma = new PrismaClient();

export class UserService implements IUserService {
  async getUserById(userId: string): Promise<IUserResponse> {
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

    if (!user) {
      throw new UserError('User not found', 404);
    }

    return user;
  }

  async updateUser(userId: string, data: IUpdateUserData): Promise<IUserResponse> {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      throw new UserError('User not found', 404);
    }

    // If updating email, check if it's already taken
    if (data.email && data.email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (emailTaken) {
        throw new UserError('Email already taken', 409);
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        role: true,
        points: true,
        createdAt: true
      }
    });

    return updatedUser;
  }

  async addPoints(userId: string, points: number): Promise<IUserResponse> {
    if (points <= 0) {
      throw new UserError('Points must be greater than 0', 400);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        points: {
          increment: points
        },
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        role: true,
        points: true,
        createdAt: true
      }
    });

    return updatedUser;
  }

  async deductPoints(userId: string, points: number): Promise<IUserResponse> {
    if (points <= 0) {
      throw new UserError('Points must be greater than 0', 400);
    }

    // Check if user has enough points
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { points: true }
    });

    if (!user) {
      throw new UserError('User not found', 404);
    }

    if (user.points < points) {
      throw new UserError('Insufficient points', 400);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        points: {
          decrement: points
        },
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        role: true,
        points: true,
        createdAt: true
      }
    });

    return updatedUser;
  }

  async getAllUsers(page: number = 1, limit: number = 10): Promise<{
    users: IUserResponse[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          role: true,
          points: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.user.count()
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      users,
      total,
      page,
      totalPages
    };
  }

  async deleteUser(userId: string): Promise<void> {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      throw new UserError('User not found', 404);
    }

    await prisma.user.delete({
      where: { id: userId }
    });
  }
}
