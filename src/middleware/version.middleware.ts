import { Request, Response, NextFunction } from 'express';

export const apiVersionMiddleware = (version: string) => {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('API-Version', version);
    next();
  };
};
