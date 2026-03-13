import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { config } from '../config/env.config';
import { ConflictError } from '../errors/ConflictError';
import { NotFoundError } from '../errors/NotFoundError';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof ConflictError) {
    logger.error('Conflict error occurred', {
      correlationId: (req as any).correlationId,
      statusCode: 409,
      message: err.message,
      latestVersion: err.latestVersion,
      url: req.url,
      method: req.method,
    });

    return res.status(409).json({
      status: 'error',
      statusCode: 409,
      message: err.message,
      latestVersion: err.latestVersion,
      correlationId: (req as any).correlationId,
    });
  }

  if (err instanceof NotFoundError) {
    logger.error('Not found error occurred', {
      correlationId: (req as any).correlationId,
      statusCode: 404,
      message: err.message,
      url: req.url,
      method: req.method,
    });

    return res.status(404).json({
      status: 'error',
      statusCode: 404,
      message: err.message,
      correlationId: (req as any).correlationId,
    });
  }

  if (err instanceof ZodError) {
    logger.error('Validation error occurred', {
      correlationId: (req as any).correlationId,
      statusCode: 400,
      errors: err.errors,
      url: req.url,
      method: req.method,
    });

    return res.status(400).json({
      status: 'error',
      statusCode: 400,
      message: 'Validation failed',
      errors: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
      correlationId: (req as any).correlationId,
    });
  }

  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  logger.error('Error occurred', {
    correlationId: (req as any).correlationId,
    statusCode,
    message,
    stack: config.isDevelopment ? err.stack : undefined,
    url: req.url,
    method: req.method,
  });

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    ...(config.isDevelopment && { stack: err.stack }),
    correlationId: (req as any).correlationId,
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    statusCode: 404,
    message: `Route ${req.method} ${req.url} not found`,
    correlationId: (req as any).correlationId,
  });
};
