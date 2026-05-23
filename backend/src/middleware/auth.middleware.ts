import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { AppError } from '../utils/app-error.js';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw AppError.unauthorized('Token không được cung cấp');
  }

  const token = authHeader.substring(7);
  const payload = authService.verifyToken(token);

  req.user = payload;
  next();
}

export function authorize(...roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw AppError.unauthorized('Chưa xác thực');
    }

    if (!roles.includes(req.user.role)) {
      throw AppError.forbidden('Không có quyền truy cập');
    }

    next();
  };
}
