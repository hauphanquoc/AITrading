import { Router } from 'express';
import { analysisController } from '../controllers/analysis.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.use(authenticate);

router.post('/', asyncHandler(analysisController.analyze));

router.get('/history', asyncHandler(analysisController.getHistory));

router.get('/:id', asyncHandler(analysisController.getById));

export default router;
