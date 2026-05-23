import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.middleware.js';
import { userService } from '../services/user.service.js';
import {
  createUserSchema,
  updateUserSchema,
  listUsersQuerySchema,
} from '../schemas/user.schema.js';
import { AppError } from '../utils/app-error.js';
import { z } from 'zod';

export class UserController {
  async list(req: AuthRequest, res: Response) {
    const query = listUsersQuerySchema.parse(req.query);
    const result = await userService.list(query);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  }

  async getById(req: AuthRequest, res: Response) {
    const id = req.params.id as string;
    const user = await userService.getById(id);

    res.json({
      success: true,
      data: user,
    });
  }

  async create(req: AuthRequest, res: Response) {
    const input = createUserSchema.parse(req.body);
    const user = await userService.create(input);

    res.status(201).json({
      success: true,
      data: user,
      message: 'Tạo người dùng thành công',
    });
  }

  async update(req: AuthRequest, res: Response) {
    const id = req.params.id as string;
    const input = updateUserSchema.parse(req.body);
    const user = await userService.update(id, input);

    res.json({
      success: true,
      data: user,
      message: 'Cập nhật người dùng thành công',
    });
  }

  async delete(req: AuthRequest, res: Response) {
    const id = req.params.id as string;

    if (req.user?.userId === id) {
      throw AppError.badRequest('Không thể xóa chính mình');
    }

    const result = await userService.delete(id);

    res.json({
      success: true,
      message: result.message,
    });
  }

  async toggleActive(req: AuthRequest, res: Response) {
    const id = req.params.id as string;

    if (req.user?.userId === id) {
      throw AppError.badRequest('Không thể vô hiệu hóa chính mình');
    }

    const user = await userService.toggleActive(id);

    res.json({
      success: true,
      data: user,
      message: user.isActive ? 'Đã kích hoạt tài khoản' : 'Đã vô hiệu hóa tài khoản',
    });
  }

  async resetPassword(req: AuthRequest, res: Response) {
    const id = req.params.id as string;
    const schema = z.object({
      newPassword: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
    });
    const { newPassword } = schema.parse(req.body);

    const result = await userService.resetPassword(id, newPassword);

    res.json({
      success: true,
      message: result.message,
    });
  }
}

export const userController = new UserController();
