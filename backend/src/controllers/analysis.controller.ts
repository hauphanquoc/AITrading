import { Request, Response } from 'express';
import { analysisService } from '../services/analysis.service.js';
import { analyzeRequestSchema, getHistoryQuerySchema } from '../schemas/analysis.schema.js';
import { AppError } from '../utils/app-error.js';

export const analysisController = {
  async analyze(req: Request, res: Response) {
    const result = analyzeRequestSchema.safeParse(req.body);

    if (!result.success) {
      throw new AppError('Validation failed', 422, 'VALIDATION_ERROR');
    }

    const { timeframe, symbol } = result.data;
    const userId = req.user!.userId;

    const analysis = await analysisService.analyze(userId, timeframe, symbol);

    res.status(200).json({
      success: true,
      data: analysis,
      message: analysis.hasEntry
        ? 'Analysis complete with entry signal. 1 point deducted.'
        : 'Analysis complete. No entry signal found, no points deducted.',
    });
  },

  async getHistory(req: Request, res: Response) {
    const result = getHistoryQuerySchema.safeParse(req.query);

    if (!result.success) {
      throw new AppError('Invalid query parameters', 422, 'VALIDATION_ERROR');
    }

    const { page, limit } = result.data;
    const userId = req.user!.userId;

    const history = await analysisService.getHistory(userId, page, limit);

    res.status(200).json({
      success: true,
      data: history.items,
      pagination: history.pagination,
    });
  },

  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;

    const analysis = await analysisService.getById(userId, id);

    res.status(200).json({
      success: true,
      data: analysis,
    });
  },
};
