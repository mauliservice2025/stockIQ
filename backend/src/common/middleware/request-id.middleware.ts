import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingId = req.headers['x-request-id'] as string;
  const requestId = incomingId || crypto.randomUUID();

  (req as unknown as { id: string }).id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}

