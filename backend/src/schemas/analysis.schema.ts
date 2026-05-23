import { z } from 'zod';

export const VALID_TIMEFRAMES = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1'] as const;

export const analyzeRequestSchema = z.object({
  timeframe: z.enum(VALID_TIMEFRAMES),
  symbol: z.string().default('XAUUSD'),
});

export const getHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
export type GetHistoryQuery = z.infer<typeof getHistoryQuerySchema>;
