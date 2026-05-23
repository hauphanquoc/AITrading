import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', asyncHandler(userController.list.bind(userController)));
router.get('/:id', asyncHandler(userController.getById.bind(userController)));
router.post('/', asyncHandler(userController.create.bind(userController)));
router.patch('/:id', asyncHandler(userController.update.bind(userController)));
router.delete('/:id', asyncHandler(userController.delete.bind(userController)));
router.post('/:id/toggle-active', asyncHandler(userController.toggleActive.bind(userController)));
router.post('/:id/reset-password', asyncHandler(userController.resetPassword.bind(userController)));

export default router;
