import { z } from 'zod';

export const grantPointsSchema = z.object({
  amount: z.number().int().min(1, 'Số points phải >= 1'),
  reason: z.string().min(1, 'Vui lòng nhập lý do'),
});

export const deductPointsSchema = z.object({
  amount: z.number().int().min(1, 'Số points phải >= 1'),
  reason: z.string().min(1, 'Vui lòng nhập lý do'),
});

export const transactionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(['GRANT', 'REVOKE', 'USAGE']).optional(),
  userId: z.string().optional(),
});

export type GrantPointsInput = z.infer<typeof grantPointsSchema>;
export type DeductPointsInput = z.infer<typeof deductPointsSchema>;
export type TransactionQueryInput = z.infer<typeof transactionQuerySchema>;
