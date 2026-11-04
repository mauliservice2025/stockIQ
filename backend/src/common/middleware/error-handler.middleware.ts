import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error.js';
import { env } from '../../config/env.config.js';

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const requestId = (req.headers['x-request-id'] as string) || (req as unknown as { id?: string }).id;

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.name,
        message: err.message,
        statusCode: err.statusCode,
        details: err.details,
        requestId,
        timestamp: new Date().toISOString()
      }
    });
    return;
  }

  // Handle unexpected unhandled errors
  console.error('[Unhandled Error]', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'InternalServerError',
      message: env.NODE_ENV === 'production' ? 'An unexpected server error occurred' : err.message,
      statusCode: 500,
      requestId,
      timestamp: new Date().toISOString()
    }
  });
}

