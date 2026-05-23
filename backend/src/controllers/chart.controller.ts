import { Request, Response } from 'express';
import axios from 'axios';
import { z } from 'zod';
import { config } from '../config/index.js';
import { AppError } from '../utils/app-error.js';
import { VALID_TIMEFRAMES } from '../schemas/analysis.schema.js';

const ohlcQuerySchema = z.object({
  symbol: z.string().default('XAUUSD'),
  timeframe: z.enum(VALID_TIMEFRAMES).default('H1'),
  count: z.coerce.number().int().min(1).max(500).default(100),
});

export const chartController = {
  async getOHLC(req: Request, res: Response) {
    const result = ohlcQuerySchema.safeParse(req.query);

    if (!result.success) {
      throw new AppError('Invalid query parameters', 422, 'VALIDATION_ERROR');
    }

    const { symbol, timeframe, count } = result.data;

    try {
      const response = await axios.get(`${config.mt5Api.url}/ohlc`, {
        params: { symbol, timeframe, count },
        timeout: 10000,
      });

      res.status(200).json(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          throw new AppError('MT5 API is not available', 503, 'MT5_UNAVAILABLE');
        }
        throw new AppError(`MT5 API error: ${error.message}`, 500, 'MT5_ERROR');
      }
      throw error;
    }
  },

  async getHealth(req: Request, res: Response) {
    try {
      const response = await axios.get(`${config.mt5Api.url}/health`, {
        timeout: 5000,
      });

      res.status(200).json({
        success: true,
        data: response.data,
      });
    } catch (error) {
      res.status(200).json({
        success: true,
        data: {
          status: 'unavailable',
          mt5_available: false,
          mt5_connected: false,
        },
      });
    }
  },
};
