import express, { Express } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.config.js';
import { apiRouter } from './routes.js';
import { errorHandler } from './common/middleware/error-handler.middleware.js';
import { requestIdMiddleware } from './common/middleware/request-id.middleware.js';
import { openApiSpec } from './common/utils/openapi-spec.js';
import { NotFoundError } from './common/errors/app-error.js';

export function createApp(): Express {
  const app = express();

  // Parse CORS origins (allow web + capacitor mobile schemes)
  const allowedOrigins = [
    'http://localhost:4200',
    'http://localhost:3000',
    'capacitor://localhost',
    'http://localhost',
    'https://localhost',
    ...env.CORS_ORIGIN.split(',').map(s => s.trim())
  ];

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(null, true); // Dev-friendly permissive
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Facility-Id', 'X-Request-Id']
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Attach Request ID tracking
  app.use(requestIdMiddleware);

  // Request logger
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[HTTP ${res.statusCode}] ${req.method} ${req.originalUrl} (${duration}ms)`);
    });
    next();
  });

  // Swagger OpenAPI Documentation
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
  app.get('/api/docs.json', (req, res) => res.json(openApiSpec));

  // Mount API V1 routes
  app.use('/api/v1', apiRouter);

  // Legacy route alias compatibility
  app.use('/api', apiRouter);

  // 404 handler
  app.use((req, res, next) => {
    next(new NotFoundError(`Cannot ${req.method} ${req.originalUrl}`));
  });

  // Central Error Handler
  app.use(errorHandler);

  return app;
}

