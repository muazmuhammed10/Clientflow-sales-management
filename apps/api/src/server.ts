import { createApp } from './app';
import { ENV } from './config/env';
import { logger } from './config/logger';

const app = createApp();

const server = app.listen(ENV.PORT, () => {
  logger.info(`🚀 ClientFlow API server running in ${ENV.NODE_ENV} mode on port ${ENV.PORT}`);
  logger.info(`📍 Health check: http://localhost:${ENV.PORT}/api/v1/health`);
});

// Handle graceful shutdown
const shutdown = () => {
  logger.info('Shutting down API server gracefully...');
  server.close(() => {
    logger.info('API server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
