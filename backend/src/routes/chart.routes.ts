import { Router } from 'express';
import { chartController } from '../controllers/chart.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.use(authenticate);

router.get('/ohlc', asyncHandler(chartController.getOHLC));

router.get('/health', asyncHandler(chartController.getHealth));

export default router;
