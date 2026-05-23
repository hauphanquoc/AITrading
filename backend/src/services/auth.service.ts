import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { config } from '../config/index.js';
import { AppError } from '../utils/app-error.js';
import type { LoginInput } from '../schemas/auth.schema.js';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export class AuthService {
  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw AppError.unauthorized('Email hoặc mật khẩu không đúng');
    }

    if (!user.isActive) {
      throw AppError.forbidden('Tài khoản đã bị vô hiệu hóa');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw AppError.unauthorized('Email hoặc mật khẩu không đúng');
    }

    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        points: user.points,
      },
    };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      throw AppError.notFound('Không tìm thấy người dùng');
    }

    if (!user.isActive) {
      throw AppError.forbidden('Tài khoản đã bị vô hiệu hóa');
    }

    return user;
  }

  private generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as string,
    } as jwt.SignOptions);
  }

  verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.jwt.secret) as TokenPayload;
    } catch {
      throw AppError.unauthorized('Token không hợp lệ hoặc đã hết hạn');
    }
  }
}

export const authService = new AuthService();
