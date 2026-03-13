import { CookieOptions } from 'express';

const isProduction = process.env.NODE_ENV === 'production';

export const setCookieOptions = (maxAge: number): CookieOptions => {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge,
  };
};

export const ACCESS_TOKEN_COOKIE_NAME = 'access_token';
export const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token';

export const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
