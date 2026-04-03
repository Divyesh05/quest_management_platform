import { Router } from 'express';
import { SubmissionController } from './controller';
import { authenticateToken, requireRole } from '../auth/middleware';
import { asyncHandler } from './utils';
import { upload } from '../../middleware/upload';

const router = Router();
const submissionController = new SubmissionController();

/**
 * @swagger
 * /api/submissions:
 *   post:
 *     summary: Create a new submission for a quest
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               questId:
 *                 type: string
 *               content:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Submission successfully created
 *       400:
 *         description: Invalid input or file missing
 */
// User routes (authenticated users)
router.post('/', authenticateToken, upload.single('file'), asyncHandler(submissionController.createSubmission));
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
