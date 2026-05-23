import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import pointRoutes from './point.routes.js';
import aiConfigRoutes from './ai-config.routes.js';
import analysisRoutes from './analysis.routes.js';
import chartRoutes from './chart.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/points', pointRoutes);
router.use('/ai-config', aiConfigRoutes);
router.use('/analysis', analysisRoutes);
router.use('/chart', chartRoutes);

export default router;
