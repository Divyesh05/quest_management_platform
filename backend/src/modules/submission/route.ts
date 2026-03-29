import { Router } from 'express';
import { SubmissionController } from './controller';
import { authenticateToken, requireRole } from '../auth/middleware';
import { asyncHandler } from './utils';

const router = Router();
const submissionController = new SubmissionController();

// User routes (authenticated users)
router.post('/', authenticateToken, asyncHandler(submissionController.createSubmission));
router.get('/my', authenticateToken, asyncHandler(submissionController.getUserSubmissions));
router.get('/:submissionId', authenticateToken, asyncHandler(submissionController.getSubmissionById));
router.put('/:submissionId', authenticateToken, asyncHandler(submissionController.updateSubmission));
router.delete('/:submissionId', authenticateToken, asyncHandler(submissionController.deleteSubmission));

// Admin routes
router.get('/admin/all', authenticateToken, requireRole('admin'), asyncHandler(submissionController.getAllSubmissions));
router.patch('/:submissionId/approve', authenticateToken, requireRole('admin'), asyncHandler(submissionController.approveSubmission));
router.patch('/:submissionId/reject', authenticateToken, requireRole('admin'), asyncHandler(submissionController.rejectSubmission));
router.get('/admin/stats', authenticateToken, requireRole('admin'), asyncHandler(submissionController.getSubmissionStats));

export { router as submissionRoutes };
