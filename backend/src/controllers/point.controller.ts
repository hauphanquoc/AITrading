import { Request, Response } from 'express';
import { pointService } from '../services/point.service.js';
import {
  grantPointsSchema,
  deductPointsSchema,
  transactionQuerySchema,
} from '../schemas/point.schema.js';
import { AppError } from '../utils/app-error.js';

class PointController {
  async grantPoints(req: Request, res: Response) {
    const userId = req.params.id as string;
    const parsed = grantPointsSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError('Validation failed', 422, 'VALIDATION_ERROR');
    }

    const adminId = req.user!.userId;
    const result = await pointService.grantPoints({
      userId,
      amount: parsed.data.amount,
      reason: parsed.data.reason,
      adminId,
    });

    res.json({
      success: true,
      data: result,
      message: `Đã cấp ${parsed.data.amount} points cho user`,
    });
  }

  async deductPoints(req: Request, res: Response) {
    const userId = req.params.id as string;
    const parsed = deductPointsSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError('Validation failed', 422, 'VALIDATION_ERROR');
    }

    const adminId = req.user!.userId;
    const result = await pointService.deductPoints({
      userId,
      amount: parsed.data.amount,
      reason: parsed.data.reason,
      adminId,
    });

    res.json({
      success: true,
      data: result,
      message: `Đã thu hồi ${parsed.data.amount} points từ user`,
    });
  }

  async getUserTransactions(req: Request, res: Response) {
    const userId = req.params.id as string;
    const parsed = transactionQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      throw new AppError('Invalid query parameters', 400, 'INVALID_QUERY');
    }

    const result = await pointService.getTransactionHistory(userId, parsed.data);

    res.json({
      success: true,
      data: result.transactions,
      pagination: result.pagination,
    });
  }

  async getAllTransactions(req: Request, res: Response) {
    const parsed = transactionQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      throw new AppError('Invalid query parameters', 400, 'INVALID_QUERY');
    }

    const result = await pointService.getAllTransactions(parsed.data);

    res.json({
      success: true,
      data: result.transactions,
      pagination: result.pagination,
    });
  }

  async getStats(req: Request, res: Response) {
    const stats = await pointService.getPointStats();

    res.json({
      success: true,
      data: stats,
    });
  }
}

export const pointController = new PointController();
