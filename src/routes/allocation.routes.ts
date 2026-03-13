import { Router } from 'express';
import { AllocationController } from '../controllers/allocation.controller';
import { AllocationService } from '../services/allocation.service';
import { AllocationRepository } from '../repositories/allocation.repository';
import { requireAuth } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/rbac.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { createAllocationSchema } from '../validators/allocation.validators';
import { prisma } from '../lib/prisma';

const router = Router();
const allocationRepository = new AllocationRepository(prisma);
const allocationService = new AllocationService(allocationRepository, prisma);
const allocationController = new AllocationController(allocationService);

router.post(
  '/',
  requireAuth,
  requireAdmin,
  validateRequest(createAllocationSchema),
  allocationController.createAllocation
);

router.get(
  '/',
  requireAuth,
  requireAdmin,
  allocationController.listAllocations
);

router.get(
  '/my',
  requireAuth,
  allocationController.getMyAllocations
);

router.patch(
  '/:allocationId/accept',
  requireAuth,
  allocationController.acceptAllocation
);

router.patch(
  '/:allocationId/cancel',
  requireAuth,
  allocationController.cancelAllocation
);

export default router;
