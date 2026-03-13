import { Request, Response } from 'express';

const startTime = Date.now();

export const healthCheck = (_req: Request, res: Response) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: `${uptime}s`,
    service: 'tsm-backend',
  });
};

export const readinessCheck = async (_req: Request, res: Response) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  const checks = {
    database: 'not_configured',
  };

  const isReady = true;

  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not_ready',
    timestamp: new Date().toISOString(),
    uptime: `${uptime}s`,
    checks,
    service: 'tsm-backend',
  });
};
