import { Router } from 'express';
import { pointController } from '../controllers/point.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/stats', asyncHandler(pointController.getStats.bind(pointController)));
router.get('/transactions', asyncHandler(pointController.getAllTransactions.bind(pointController)));

router.post('/users/:id/grant', asyncHandler(pointController.grantPoints.bind(pointController)));
router.post('/users/:id/deduct', asyncHandler(pointController.deductPoints.bind(pointController)));
router.get('/users/:id/transactions', asyncHandler(pointController.getUserTransactions.bind(pointController)));

export default router;
