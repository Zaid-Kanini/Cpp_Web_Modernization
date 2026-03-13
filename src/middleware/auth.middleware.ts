import { Request, Response, NextFunction } from 'express';
import passport from '../config/passport';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate('jwt', { session: false }, (err: any, user: any) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Invalid or expired token.',
      });
    }

    req.user = user;
    next();
  })(req, res, next);
};

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate('jwt', { session: false }, (err: any, user: any) => {
    if (err) {
      res.status(500).json({
        success: false,
        message: 'Authentication error occurred.',
      });
      return;
    }

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized. Authentication required.',
      });
      return;
    }

    req.user = user;
    next();
  })(req, res, next);
};
