import { Router } from 'express';
import { QuestController } from './controller';
import { authenticateToken, requireRole } from '../auth/middleware';
import { asyncHandler } from './utils';

const router = Router();
const questController = new QuestController();

// Public routes
router.get('/', asyncHandler(questController.getAllQuests));
router.get('/active', asyncHandler(questController.getActiveQuests));
router.get('/category/:category', asyncHandler(questController.getQuestsByCategory));
router.get('/difficulty/:difficulty', asyncHandler(questController.getQuestsByDifficulty));
router.get('/:questId', asyncHandler(questController.getQuestById));

// Protected routes (authenticated users)
router.post('/', authenticateToken, requireRole('admin'), asyncHandler(questController.createQuest));
router.put('/:questId', authenticateToken, requireRole('admin'), asyncHandler(questController.updateQuest));
router.delete('/:questId', authenticateToken, requireRole('admin'), asyncHandler(questController.deleteQuest));
router.patch('/:questId/toggle', authenticateToken, requireRole('admin'), asyncHandler(questController.toggleQuestStatus));

// Admin routes
router.get('/admin/stats', authenticateToken, requireRole('admin'), asyncHandler(questController.getQuestStats));

export { router as questRoutes };
