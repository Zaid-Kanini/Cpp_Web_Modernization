import argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.utils';
import { LoginRequest, LoginResponse } from '../types/auth.types';
import { prisma } from '../lib/prisma';

const ACCOUNT_LOCKOUT_DURATION_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

export class AuthService {
  async login(
    loginData: LoginRequest,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ response: LoginResponse; accessToken: string; refreshToken: string }> {
    const { email, password } = loginData;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        user_id: true,
        email: true,
        password_hash: true,
        role: true,
        first_name: true,
        last_name: true,
        is_active: true,
        failed_login_attempts: true,
        account_locked_until: true,
      },
    });

    if (!user) {
      await this.logFailedLogin(null, email, ipAddress, userAgent);
      throw new Error('Invalid credentials');
    }

    if (!user.is_active) {
      await this.logFailedLogin(user.user_id, email, ipAddress, userAgent);
      throw new Error('Account is inactive');
    }

    if (user.account_locked_until && user.account_locked_until > new Date()) {
      await this.logFailedLogin(user.user_id, email, ipAddress, userAgent);
      const lockoutMinutes = Math.ceil(
        (user.account_locked_until.getTime() - Date.now()) / 60000
      );
      throw new Error(`Account is locked. Try again in ${lockoutMinutes} minutes.`);
    }

    const isPasswordValid = await argon2.verify(user.password_hash, password);

    if (!isPasswordValid) {
      const newFailedAttempts = user.failed_login_attempts + 1;
      const updateData: any = {
        failed_login_attempts: newFailedAttempts,
      };

      if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        updateData.account_locked_until = new Date(Date.now() + ACCOUNT_LOCKOUT_DURATION_MS);
      }

      await prisma.user.update({
        where: { user_id: user.user_id },
        data: updateData,
      });

      await this.logFailedLogin(user.user_id, email, ipAddress, userAgent);

      if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        throw new Error(
          'Account locked due to multiple failed login attempts. Try again in 15 minutes.'
        );
      }

      throw new Error('Invalid credentials');
    }

    await prisma.user.update({
      where: { user_id: user.user_id },
      data: {
        failed_login_attempts: 0,
        account_locked_until: null,
      },
    });

    const tokenPayload = {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await this.logSuccessfulLogin(user.user_id, ipAddress, userAgent);

    const response: LoginResponse = {
      user: {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
      },
      message: 'Login successful',
    };

    return { response, accessToken, refreshToken };
  }

  private async logSuccessfulLogin(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action_type: 'LOGIN_SUCCESS',
        entity_type: 'USER',
        entity_id: userId,
        ip_address: ipAddress,
        user_agent: userAgent,
        correlation_id: uuidv4(),
      },
    });
  }

  private async logFailedLogin(
    userId: string | null,
    email: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action_type: 'LOGIN_FAILURE',
        entity_type: 'USER',
        entity_id: userId || uuidv4(),
        before_value: { email },
        ip_address: ipAddress,
        user_agent: userAgent,
        correlation_id: uuidv4(),
      },
    });
  }
}
