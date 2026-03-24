import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt.utils.js';
import { ApiResponse } from '../types/index.js';
import { supabase } from '../config/supabase.js';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Authentication middleware - verify access token
 */
export function authenticate(req: Request, res: Response<ApiResponse>, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Access token không được cung cấp',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const payload = verifyAccessToken(token);

      // Check if user still exists in database
      supabase
        .from('users')
        .select('id')
        .eq('id', payload.userId)
        .single()
        .then(({ data, error }: { data: any; error: any }) => {
          if (error || !data) {
            res.status(401).json({
              success: false,
              error: 'Tài khoản không còn tồn tại. Vui lòng đăng nhập lại.',
            });
            return;
          }
          req.user = payload;
          next();
        });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Access token không hợp lệ hoặc đã hết hạn',
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi xác thực',
    });
  }
}

/**
 * Optional authentication - attach user if token is valid, but don't require it
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        req.user = verifyAccessToken(token);
      } catch (error) {
        // Token invalid, but continue without user
      }
    }
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}

/**
 * Role-based authorization middleware
 */
export function authorize(...allowedRoles: ('worker' | 'manager' | 'admin')[]) {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Chưa đăng nhập',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Không có quyền truy cập',
      });
      return;
    }

    next();
  };
}
