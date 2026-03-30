import { Router } from 'express';
import { AuthenticatedRequest, ApiResponse, PaginatedResponse } from '../../types';
import { prisma } from '../database/service';
import { authenticateToken, requireRole } from '../../middleware/auth';
import { asyncHandler, validateRequest } from '../../middleware/errorHandler';
import { questCreateSchema, questUpdateSchema, questQuerySchema, idParamSchema } from '../../validation/schemas';

const router = Router();

// Get all quests (public)
router.get('/',
  validateRequest(questQuerySchema, 'query'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { page, limit, sortBy, sortOrder, category, difficulty, isActive } = req.query as any;
    
    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (category) where.category = category;
    if (difficulty) where.difficulty = difficulty;
    if (isActive !== undefined) where.isActive = isActive;

    const [quests, total] = await Promise.all([
      prisma.quest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy || 'createdAt']: sortOrder },
        include: {
          _count: {
            select: {
              submissions: true,
            },
          },
        },
      }),
      prisma.quest.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    const response: PaginatedResponse = {
      success: true,
      message: 'Quests retrieved successfully',
      data: quests,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    };

    res.json(response);
  })
);

// Get quest by ID (public)
router.get('/:id',
  validateRequest(idParamSchema, 'params'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const quest = await prisma.quest.findUnique({
      where: { id: req.params.id },
      include: {
        submissions: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
          take: 10, // Limit recent submissions
          orderBy: { submittedAt: 'desc' }
        },
        _count: {
          select: {
            submissions: true,
            achievements: true,
          },
        },
      },
    });

    if (!quest) {
      return res.status(404).json({
        success: false,
        message: 'Quest not found',
        error: 'QUEST_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Quest retrieved successfully',
      data: quest
    });
  })
);

// Create new quest (admin only)
router.post('/',
  authenticateToken,
  requireRole('admin'),
  validateRequest(questCreateSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { title, description, reward, difficulty, category } = req.body;

    const quest = await prisma.quest.create({
      data: {
        title,
        description,
        reward,
        difficulty,
        category,
        createdBy: req.user!.id,
      },
      include: {
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Quest created successfully',
      data: quest
    });
  })
);

// Update quest (admin only)
router.put('/:id',
  authenticateToken,
  requireRole('admin'),
  validateRequest(idParamSchema, 'params'),
  validateRequest(questUpdateSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { id } = req.params;
    const updateData = req.body;

    const quest = await prisma.quest.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Quest updated successfully',
      data: quest
    });
  })
);

// Delete quest (admin only)
router.delete('/:id',
  authenticateToken,
  requireRole('admin'),
  validateRequest(idParamSchema, 'params'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { id } = req.params;

    await prisma.quest.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Quest deleted successfully',
      data: null
    });
  })
);

// Get quest categories (public)
router.get('/categories/list',
  asyncHandler(async (_req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const categories = await prisma.quest.findMany({
      select: {
        category: true,
      },
      distinct: ['category']
    });

    const categoryList = categories.map(c => c.category);

    res.json({
      success: true,
      message: 'Categories retrieved successfully',
      data: categoryList
    });
  })
);

export default router;
