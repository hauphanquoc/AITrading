import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/app-error.js';
import type { CreateUserInput, UpdateUserInput, ListUsersQuery } from '../schemas/user.schema.js';

const SALT_ROUNDS = 12;

export class UserService {
  async list(query: ListUsersQuery) {
    const { page, limit, search, role, isActive, sortBy, order } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          points: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        points: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            analysisHistory: true,
            pointTransactions: true,
          },
        },
      },
    });

    if (!user) {
      throw AppError.notFound('Không tìm thấy người dùng');
    }

    return user;
  }

  async create(input: CreateUserInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw AppError.conflict('Email đã được sử dụng');
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
        role: input.role,
        points: input.points,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        points: true,
        isActive: true,
        createdAt: true,
      },
    });

    return user;
  }

  async update(id: string, input: UpdateUserInput) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw AppError.notFound('Không tìm thấy người dùng');
    }

    if (input.email && input.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
      });
      if (existingUser) {
        throw AppError.conflict('Email đã được sử dụng');
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: input,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        points: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async delete(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw AppError.notFound('Không tìm thấy người dùng');
    }

    await prisma.user.delete({
      where: { id },
    });

    return { message: 'Đã xóa người dùng thành công' };
  }

  async toggleActive(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw AppError.notFound('Không tìm thấy người dùng');
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        points: true,
        isActive: true,
      },
    });

    return updatedUser;
  }

  async resetPassword(id: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw AppError.notFound('Không tìm thấy người dùng');
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    return { message: 'Đã đặt lại mật khẩu thành công' };
  }
}

export const userService = new UserService();
