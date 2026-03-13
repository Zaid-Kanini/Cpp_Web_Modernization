import { Router } from 'express';
import { ScheduleController } from '../controllers/schedule.controller';
import { ScheduleService } from '../services/schedule.service';
import { ScheduleRepository } from '../repositories/schedule.repository';
import { requireAuth } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/rbac.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { createScheduleSchema, updateScheduleSchema } from '../validators/schedule.validators';
import { paginationQuerySchema } from '../validators/pagination.validators';
import { prisma } from '../lib/prisma';

const router = Router();
const scheduleRepository = new ScheduleRepository(prisma);
const scheduleService = new ScheduleService(scheduleRepository);
const scheduleController = new ScheduleController(scheduleService);

router.post(
  '/',
  requireAuth,
  requireAdmin,
  validateRequest(createScheduleSchema),
  scheduleController.createSchedule
);

router.get(
  '/',
  requireAuth,
  requireAdmin,
  validateRequest(paginationQuerySchema, 'query'),
  scheduleController.listSchedules
);

router.get(
  '/:scheduleId',
  requireAuth,
  scheduleController.getScheduleById
);

router.get(
  '/batch/:batchId',
  requireAuth,
  scheduleController.getScheduleByBatchId
);

router.patch(
  '/:scheduleId',
  requireAuth,
  requireAdmin,
  validateRequest(updateScheduleSchema),
  scheduleController.updateSchedule
);

router.delete(
  '/:scheduleId',
  requireAuth,
  requireAdmin,
  scheduleController.deleteSchedule
);

export default router;
