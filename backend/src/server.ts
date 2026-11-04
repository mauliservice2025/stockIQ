import { createApp } from './app.js';
import { env } from './config/env.config.js';
import { pool } from './database/client.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`====================================================`);
  console.log(` StockIQ Enterprise API Backend (v2.0.0)`);
  console.log(` Server listening on: http://localhost:${env.PORT}`);
  console.log(` OpenAPI / Swagger Docs: http://localhost:${env.PORT}/api/docs`);
  console.log(` Environment: ${env.NODE_ENV}`);
  console.log(`====================================================`);
});

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      await pool.end();
      console.log('Database pool drained.');
    } catch (err) {
      console.error('Error closing database pool:', err);
    }
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forced shutdown after 10s timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

