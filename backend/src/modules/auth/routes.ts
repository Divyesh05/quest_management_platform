import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest, ApiResponse, AuthResponse, LoginRequest, RegisterRequest } from '../../types';
import { prisma } from '../database/service';
import { authenticateToken, generateToken } from '../../middleware/auth';
import { asyncHandler, validateRequest } from '../../middleware/errorHandler';
import { loginSchema, registerSchema } from '../../validation/schemas';

const router = Router();

// Register new user
router.post('/register', 
  validateRequest(registerSchema),
  asyncHandler(async (req: Request, res: Response<ApiResponse<AuthResponse>>) => {
    const { email, password, name } = req.body as RegisterRequest;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
        error: 'USER_EXISTS'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'user',
        points: 0,
      },
      select: {
        id: true,
        email: true,
        role: true,
        points: true,
        createdAt: true,
      }
    });

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Return response
    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        name: name || user.email.split('@')[0],
        role: user.role,
        points: user.points,
      },
      token
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: response
    });
  })
);

// Login user
router.post('/login',
  validateRequest(loginSchema),
  asyncHandler(async (req: Request, res: Response<ApiResponse<AuthResponse>>) => {
    const { email, password } = req.body as LoginRequest;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Return response
    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        name: user.email.split('@')[0], // Default name from email
        role: user.role,
        points: user.points,
      },
      token
    };

    res.json({
      success: true,
      message: 'Login successful',
      data: response
    });
  })
);

// Get current user profile
router.get('/profile',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        role: true,
        points: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            submissions: true,
            achievements: true,
            rewards: true,
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        ...user,
        name: user.email.split('@')[0], // Default name from email
      }
    });
  })
);

// Update user profile
router.put('/profile',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { name } = req.body;
    
    // Note: Since we don't have a name field in the User model yet,
    // we'll just return the current profile. In a real app, you'd
    // add the name field to the User model.
    
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        role: true,
        points: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        ...user,
        name: name || user.email.split('@')[0],
      }
    });
  })
);

// Refresh token
router.post('/refresh',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<{ token: string }>>) => {
    const token = generateToken({
      id: req.user!.id,
      email: req.user!.email,
      role: req.user!.role
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: { token }
    });
  })
);

// Logout (client-side token removal)
router.post('/logout',
  authenticateToken,
  asyncHandler(async (_req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    res.json({
      success: true,
      message: 'Logout successful',
      data: null
    });
  })
);

export default router;
