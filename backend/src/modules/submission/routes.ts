import { Router } from 'express';
import { SubmissionController } from './controller';
import { authenticateToken, authorize } from '../auth/middleware/auth';
import { validateSubmission } from './middleware/validation';
import { asyncHandler } from '../../middleware/errorHandler';

const router = Router();

// Protected routes
router.get('/', authenticateToken, asyncHandler(SubmissionController.getMySubmissions));
router.post('/', authenticateToken, validateSubmission, asyncHandler(SubmissionController.createSubmission));
router.get('/:id', authenticateToken, asyncHandler(SubmissionController.getSubmissionById));
router.put('/:id', authenticateToken, validateSubmission, asyncHandler(SubmissionController.updateSubmission));
router.delete('/:id', authenticateToken, asyncHandler(SubmissionController.deleteSubmission));

// Admin/Moderator routes
router.get('/all', authenticateToken, authorize('admin', 'moderator'), asyncHandler(SubmissionController.getAllSubmissions));
router.put('/:id/approve', authenticateToken, authorize('admin', 'moderator'), asyncHandler(SubmissionController.approveSubmission));
router.put('/:id/reject', authenticateToken, authorize('admin', 'moderator'), asyncHandler(SubmissionController.rejectSubmission));
router.get('/pending', authenticateToken, authorize('admin', 'moderator'), asyncHandler(SubmissionController.getPendingSubmissions));

export default router;
