import { Router } from 'express';
import { AuthenticatedRequest, ApiResponse, PaginatedResponse } from '../../types';
import { prisma } from '../database/service';
import { authenticateToken, requireRole } from '../../middleware/auth';
import { asyncHandler, validateRequest } from '../../middleware/errorHandler';
import { 
  submissionCreateSchema, 
  submissionUpdateSchema, 
  submissionQuerySchema, 
  idParamSchema 
} from '../../validation/schemas';

const router = Router();

// Get all submissions (admin only)
router.get('/',
  authenticateToken,
  requireRole('admin'),
  validateRequest(submissionQuerySchema, 'query'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { page, limit, sortBy, sortOrder, userId, questId, status } = req.query as any;
    
    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (userId) where.userId = userId;
    if (questId) where.questId = questId;
    if (status) where.status = status;

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy || 'submittedAt']: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
          quest: {
            select: {
              id: true,
              title: true,
              description: true,
              reward: true,
              difficulty: true,
              category: true,
            },
          },
        },
      }),
      prisma.submission.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    const response: PaginatedResponse = {
      success: true,
      message: 'Submissions retrieved successfully',
      data: submissions,
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

// Get submissions for current user
router.get('/my',
  authenticateToken,
  validateRequest(submissionQuerySchema, 'query'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { page, limit, sortBy, sortOrder, status } = req.query as any;
    
    const skip = (page - 1) * limit;
    
    const where: any = { userId: req.user!.id };
    if (status) where.status = status;

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy || 'submittedAt']: sortOrder },
        include: {
          quest: {
            select: {
              id: true,
              title: true,
              description: true,
              reward: true,
              difficulty: true,
              category: true,
            },
          },
        },
      }),
      prisma.submission.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    const response: PaginatedResponse = {
      success: true,
      message: 'My submissions retrieved successfully',
      data: submissions,
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

// Get submission by ID
router.get('/:id',
  authenticateToken,
  validateRequest(idParamSchema, 'params'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const submission = await prisma.submission.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        quest: {
          select: {
            id: true,
            title: true,
            description: true,
            reward: true,
            difficulty: true,
            category: true,
          },
        },
      },
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found',
        error: 'SUBMISSION_NOT_FOUND'
      });
    }

    // Check if user owns the submission or is admin
    if (submission.userId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        error: 'ACCESS_DENIED'
      });
    }

    res.json({
      success: true,
      message: 'Submission retrieved successfully',
      data: submission
    });
  })
);

// Create new submission
router.post('/',
  authenticateToken,
  validateRequest(submissionCreateSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { questId, content } = req.body;
    const userId = req.user!.id;

    // Check if quest exists and is active
    const quest = await prisma.quest.findUnique({
      where: { id: questId }
    });

    if (!quest) {
      return res.status(404).json({
        success: false,
        message: 'Quest not found',
        error: 'QUEST_NOT_FOUND'
      });
    }

    if (!quest.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Quest is not active',
        error: 'QUEST_NOT_ACTIVE'
      });
    }

    // Check if user already submitted this quest
    const existingSubmission = await prisma.submission.findUnique({
      where: {
        userId_questId: {
          userId,
          questId,
        },
      },
    });

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted this quest',
        error: 'ALREADY_SUBMITTED'
      });
    }

    const submission = await prisma.submission.create({
      data: {
        userId,
        questId,
        content,
        status: 'pending',
      },
      include: {
        quest: {
          select: {
            title: true,
            reward: true,
            difficulty: true,
            category: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Submission created successfully',
      data: submission
    });
  })
);

// Update submission (admin only - for reviewing)
router.put('/:id',
  authenticateToken,
  requireRole('admin'),
  validateRequest(idParamSchema, 'params'),
  validateRequest(submissionUpdateSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { id } = req.params;
    const { status, feedback, score } = req.body;

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        quest: true,
        user: true,
      },
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found',
        error: 'SUBMISSION_NOT_FOUND'
      });
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id },
      data: {
        status,
        feedback,
        score,
        reviewedAt: new Date(),
        reviewedBy: req.user!.id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        quest: {
          select: {
            id: true,
            title: true,
            reward: true,
            difficulty: true,
            category: true,
          },
        },
      },
    });

    // If submission is approved, award points and create achievement
    if (status === 'approved' && submission.status !== 'approved') {
      await Promise.all([
        // Update user points
        prisma.user.update({
          where: { id: submission.userId },
          data: {
            points: {
              increment: submission.quest.reward,
            },
          },
        }),
        // Create achievement
        prisma.achievement.create({
          data: {
            userId: submission.userId,
            questId: submission.questId,
          },
        }),
        // Create reward record
        prisma.reward.create({
          data: {
            userId: submission.userId,
            questId: submission.questId,
            type: 'quest_completion',
            points: submission.quest.reward,
            description: `Completed quest: ${submission.quest.title}`,
            metadata: {
              questTitle: submission.quest.title,
              submissionId: id,
            },
          },
        }),
      ]);
    }

    res.json({
      success: true,
      message: 'Submission updated successfully',
      data: updatedSubmission
    });
  })
);

// Delete submission (admin only)
router.delete('/:id',
  authenticateToken,
  requireRole('admin'),
  validateRequest(idParamSchema, 'params'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { id } = req.params;

    await prisma.submission.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Submission deleted successfully',
      data: null
    });
  })
);

export default router;
