import { Router } from 'express';
import { aiConfigController } from '../controllers/ai-config.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

// All routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

// GET /ai-config/active - Get active config
router.get('/active', asyncHandler(aiConfigController.getActiveConfig));

// GET /ai-config - Get all configs
router.get('/', asyncHandler(aiConfigController.getAllConfigs));

// GET /ai-config/:id - Get config by id
router.get('/:id', asyncHandler(aiConfigController.getConfigById));

// POST /ai-config - Create new config
router.post('/', asyncHandler(aiConfigController.createConfig));

// PUT /ai-config/:id - Update config
router.put('/:id', asyncHandler(aiConfigController.updateConfig));

// DELETE /ai-config/:id - Delete config
router.delete('/:id', asyncHandler(aiConfigController.deleteConfig));

// POST /ai-config/:id/activate - Set config as active
router.post('/:id/activate', asyncHandler(aiConfigController.setActiveConfig));

export default router;
