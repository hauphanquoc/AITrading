import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  name: z.string().min(2, 'Tên tối thiểu 2 ký tự'),
  role: z.enum(['USER', 'ADMIN']).default('USER'),
  points: z.number().int().min(0).default(0),
});

export const updateUserSchema = z.object({
  email: z.string().email('Email không hợp lệ').optional(),
  name: z.string().min(2, 'Tên tối thiểu 2 ký tự').optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  points: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z.enum(['createdAt', 'name', 'email', 'points']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
