import { Router } from 'express';
import passport from 'passport';
import { requireAdmin } from '../middleware/rbac.middleware';
import {
  createUserHandler,
  updateUserHandler,
  deleteUserHandler,
  listUsersHandler,
} from '../controllers/user.controller';

// User management routes
const router = Router();

router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  requireAdmin,
  createUserHandler as any
);

router.patch(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  requireAdmin,
  updateUserHandler as any
);

router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  requireAdmin,
  deleteUserHandler as any
);

router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  requireAdmin,
  listUsersHandler as any
);

export default router;
