import { Router } from 'express';
import { getHealthStatus, getReadinessStatus } from './health.controller.js';

export const healthRouter = Router();

healthRouter.get('/health', getHealthStatus);
healthRouter.get('/ready', getReadinessStatus);
