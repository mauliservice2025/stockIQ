import { Request, Response } from 'express';
import { checkDatabaseConnection } from '../../database/client.js';

export async function getHealthStatus(req: Request, res: Response): Promise<void> {
  const dbStatus = await checkDatabaseConnection();

  const status = {
    status: dbStatus.isHealthy ? 'healthy' : 'degraded',
    version: '2.0.0',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      connected: dbStatus.isHealthy,
      latencyMs: dbStatus.latencyMs,
      error: dbStatus.error
    }
  };

  res.status(dbStatus.isHealthy ? 200 : 503).json(status);
}

export function getReadinessStatus(req: Request, res: Response): void {
  res.status(200).json({ status: 'ready' });
}
