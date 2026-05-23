import { prisma } from '../lib/prisma.js';
import { TransactionType } from '@prisma/client';
import { AppError } from '../utils/app-error.js';

interface GrantPointsData {
  userId: string;
  amount: number;
  reason: string;
  adminId: string;
}

interface DeductPointsData {
  userId: string;
  amount: number;
  reason: string;
  adminId: string;
}

interface ListTransactionsQuery {
  page: number;
  limit: number;
  type?: TransactionType;
}

class PointService {
  async grantPoints(data: GrantPointsData) {
    const { userId, amount, reason, adminId } = data;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { points: { increment: amount } },
        select: { id: true, email: true, name: true, points: true },
      });

      const transaction = await tx.pointTransaction.create({
        data: {
          userId,
          amount,
          type: TransactionType.GRANT,
          reason,
          createdBy: adminId,
        },
      });

      return { user: updatedUser, transaction };
    });

    return result;
  }

  async deductPoints(data: DeductPointsData) {
    const { userId, amount, reason, adminId } = data;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (user.points < amount) {
      throw new AppError(
        `Insufficient points. Current: ${user.points}, Requested: ${amount}`,
        400,
        'INSUFFICIENT_POINTS'
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { points: { decrement: amount } },
        select: { id: true, email: true, name: true, points: true },
      });

      const transaction = await tx.pointTransaction.create({
        data: {
          userId,
          amount: -amount,
          type: TransactionType.REVOKE,
          reason,
          createdBy: adminId,
        },
      });

      return { user: updatedUser, transaction };
    });

    return result;
  }

  async getTransactionHistory(userId: string, query: ListTransactionsQuery) {
    const { page, limit, type } = query;
    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const where = {
      userId,
      ...(type && { type }),
    };

    const [transactions, total] = await Promise.all([
      prisma.pointTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.pointTransaction.count({ where }),
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAllTransactions(query: ListTransactionsQuery & { userId?: string }) {
    const { page, limit, type, userId } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(userId && { userId }),
      ...(type && { type }),
    };

    const [transactions, total] = await Promise.all([
      prisma.pointTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
        },
      }),
      prisma.pointTransaction.count({ where }),
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPointStats() {
    const [totalGranted, totalRevoked, totalUsage] = await Promise.all([
      prisma.pointTransaction.aggregate({
        where: { type: TransactionType.GRANT },
        _sum: { amount: true },
      }),
      prisma.pointTransaction.aggregate({
        where: { type: TransactionType.REVOKE },
        _sum: { amount: true },
      }),
      prisma.pointTransaction.aggregate({
        where: { type: TransactionType.USAGE },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalGranted: totalGranted._sum.amount || 0,
      totalRevoked: Math.abs(totalRevoked._sum.amount || 0),
      totalUsage: Math.abs(totalUsage._sum.amount || 0),
    };
  }
}

export const pointService = new PointService();
