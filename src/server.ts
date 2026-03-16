import app from './app';
import { config, validateConfig } from './config/env.config';
import { logger } from './utils/logger';

try {
  validateConfig();
} catch (error) {
  console.error('Environment validation failed:', error);
  process.exit(1);
}

const PORT = config.port;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  logger.info(`Server running on ${HOST}:${PORT} in ${config.nodeEnv} mode`);
  console.log(`Server listening on ${HOST}:${PORT}`);
});

const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} signal received: closing HTTP server`);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
