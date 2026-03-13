import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { loginSchema } from '../validators/auth.validators';
import { verifyPassword, hashPassword } from '../utils/password.utils';
import { passwordComplexitySchema } from '../validators/password.validators';
import {
  setCookieOptions,
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
} from '../utils/cookie.utils';
import { prisma } from '../lib/prisma';

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validationResult = loginSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const { response, accessToken, refreshToken } = await authService.login(
        validationResult.data,
        ipAddress,
        userAgent
      );

      res.cookie(
        ACCESS_TOKEN_COOKIE_NAME,
        accessToken,
        setCookieOptions(ACCESS_TOKEN_MAX_AGE)
      );

      res.cookie(
        REFRESH_TOKEN_COOKIE_NAME,
        refreshToken,
        setCookieOptions(REFRESH_TOKEN_MAX_AGE)
      );

      res.status(200).json({
        success: true,
        accessToken,
        ...response,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Invalid credentials')) {
          res.status(401).json({
            success: false,
            message: 'Invalid email or password',
          });
          return;
        }

        if (error.message.includes('Account is locked') || error.message.includes('locked due to')) {
          res.status(403).json({
            success: false,
            message: error.message,
          });
          return;
        }

        if (error.message.includes('Account is inactive')) {
          res.status(403).json({
            success: false,
            message: 'Account is inactive. Please contact administrator.',
          });
          return;
        }
      }

      next(error);
    }
  }

  async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { user_id: req.user.user_id },
        select: {
          user_id: true,
          email: true,
          role: true,
          first_name: true,
          last_name: true,
          is_active: true,
          technology_specializations: true,
          force_password_change: true,
        },
      });

      if (!user || !user.is_active) {
        res.status(401).json({ success: false, message: 'User not found or inactive' });
        return;
      }

      res.status(200).json({
        success: true,
        user: {
          user_id: user.user_id,
          email: user.email,
          role: user.role,
          first_name: user.first_name,
          last_name: user.last_name,
          technology_specializations: user.technology_specializations,
          force_password_change: user.force_password_change,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.clearCookie(ACCESS_TOKEN_COOKIE_NAME);
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME);
      res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
      }

      const { current_password, new_password } = req.body;

      if (!current_password || !new_password) {
        res.status(400).json({ success: false, message: 'Current password and new password are required' });
        return;
      }

      const complexity = passwordComplexitySchema.safeParse(new_password);
      if (!complexity.success) {
        res.status(400).json({
          success: false,
          message: 'Password does not meet complexity requirements',
          errors: complexity.error.errors.map((e) => e.message),
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { user_id: req.user.user_id },
        select: { user_id: true, password_hash: true },
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const isCurrentValid = await verifyPassword(current_password, user.password_hash);
      if (!isCurrentValid) {
        res.status(400).json({ success: false, message: 'Current password is incorrect' });
        return;
      }

      const newHash = await hashPassword(new_password);
      await prisma.user.update({
        where: { user_id: user.user_id },
        data: { password_hash: newHash, force_password_change: false },
      });

      res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  }
}
