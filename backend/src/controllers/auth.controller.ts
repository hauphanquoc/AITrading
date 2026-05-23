import { Response } from 'express';
import { authService } from '../services/auth.service.js';
import { loginSchema } from '../schemas/auth.schema.js';
import { asyncHandler } from '../utils/async-handler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const input = loginSchema.parse(req.body);
  const result = await authService.login(input);

  res.json({
    success: true,
    data: result,
    message: 'Đăng nhập thành công',
  });
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await authService.getMe(req.user!.userId);

  res.json({
    success: true,
    data: user,
  });
});

export const logout = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    message: 'Đăng xuất thành công',
  });
});
