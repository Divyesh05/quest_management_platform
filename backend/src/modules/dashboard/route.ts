import { Router } from 'express';
import { DashboardController } from './controller';
import { authenticateToken, requireRole } from '../auth/middleware';
import { asyncHandler } from './utils';

const router = Router();
const dashboardController = new DashboardController();

// Admin routes
router.get('/admin/stats', authenticateToken, requireRole('admin'), asyncHandler(dashboardController.getDashboardStats));
router.get('/admin/quest/:questId', authenticateToken, requireRole('admin'), asyncHandler(dashboardController.getQuestAnalytics));

// User routes
router.get('/user/stats', authenticateToken, asyncHandler(dashboardController.getUserDashboardStats));

export { router as dashboardRoutes };
