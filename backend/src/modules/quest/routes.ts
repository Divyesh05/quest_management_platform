import { Router } from 'express';
import { QuestController } from './controller';
import { authenticateToken, authorize } from '../auth/middleware/auth';
import { validateQuest } from './middleware/validation';
import { asyncHandler } from '../../middleware/errorHandler';

const router = Router();

// Public routes
router.get('/', asyncHandler(QuestController.getAllQuests));
router.get('/active', asyncHandler(QuestController.getActiveQuests));
router.get('/category/:category', asyncHandler(QuestController.getQuestsByCategory));
router.get('/difficulty/:difficulty', asyncHandler(QuestController.getQuestsByDifficulty));
router.get('/:id', asyncHandler(QuestController.getQuestById));

// Protected routes
router.post('/', authenticateToken, authorize('admin', 'moderator'), validateQuest, asyncHandler(QuestController.createQuest));
router.put('/:id', authenticateToken, authorize('admin', 'moderator'), validateQuest, asyncHandler(QuestController.updateQuest));
router.delete('/:id', authenticateToken, authorize('admin'), asyncHandler(QuestController.deleteQuest));
router.post('/:id/complete', authenticateToken, asyncHandler(QuestController.completeQuest));

export default router;
