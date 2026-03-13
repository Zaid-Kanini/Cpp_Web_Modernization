import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/auth.types';

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized. Authentication required.',
    });
    return;
  }

  if (req.user.role !== UserRole.ADMIN) {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.',
    });
    return;
  }

  next();
};

export const requireFaculty = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized. Authentication required.',
    });
    return;
  }

  if (req.user.role !== UserRole.FACULTY) {
    res.status(403).json({
      success: false,
      message: 'Access denied. Faculty role required.',
    });
    return;
  }

  next();
};
