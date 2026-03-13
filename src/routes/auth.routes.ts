import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

router.post('/login', authController.login.bind(authController) as any);
router.get('/me', requireAuth, authController.getCurrentUser.bind(authController) as any);
router.post('/logout', requireAuth, authController.logout.bind(authController) as any);
router.post('/change-password', requireAuth, authController.changePassword.bind(authController) as any);

export default router;
