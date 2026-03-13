import { Router } from 'express';
import { healthCheck, readinessCheck } from '../controllers/health.controller';

const router = Router();

router.get('/health', healthCheck as any);
router.get('/ready', readinessCheck as any);

export default router;
