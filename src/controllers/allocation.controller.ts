import { Request, Response, NextFunction } from 'express';
import { AllocationService } from '../services/allocation.service';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';

export class AllocationController {
  constructor(private allocationService: AllocationService) {}

  createAllocation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.user_id;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      const correlationId = uuidv4();
      const { faculty_id, schedule_ids } = req.body;

      const result = await this.allocationService.allocateTrainer(
        faculty_id,
        schedule_ids,
        userId,
        correlationId
      );

      if (result.conflicts.length === 0) {
        return res.status(201).json({
          message: 'All allocations created successfully',
          allocations: result.successful,
        });
      }

      if (result.successful.length === 0) {
        return res.status(400).json({
          error: 'Allocation failed',
          message: 'All schedules have conflicts',
          conflicts: result.conflicts,
        });
      }

      return res.status(207).json({
        message: 'Partial success: Some allocations created, some conflicts',
        allocations: result.successful,
        conflicts: result.conflicts,
      });
    } catch (error) {
      next(error);
    }
  };

  listAllocations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { faculty_id, status, start_date, end_date, page = '1', limit = '10' } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};
      if (faculty_id) where.faculty_id = faculty_id as string;
      if (status) where.allocation_status = status as string;
      if (start_date || end_date) {
        where.schedule = {
          is_active: true,
          ...(start_date && { start_date: { gte: new Date(start_date as string) } }),
          ...(end_date && { end_date: { lte: new Date(end_date as string) } }),
        };
      }

      const [allocations, total] = await Promise.all([
        prisma.trainerAllocation.findMany({
          where,
          include: {
            schedule: { select: { batch_id: true, technology: true, start_date: true, end_date: true, venue: true, number_of_participants: true, number_of_days: true, status: true } },
            faculty: { select: { user_id: true, first_name: true, last_name: true, email: true } },
          },
          orderBy: { allocation_date: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.trainerAllocation.count({ where }),
      ]);

      return res.status(200).json({
        allocations: allocations.map((a) => ({
          allocation_id: a.allocation_id,
          schedule_id: a.schedule_id,
          faculty_id: a.faculty_id,
          allocation_status: a.allocation_status,
          allocation_date: a.allocation_date,
          response_date: a.response_date,
          cancellation_reason: a.cancellation_reason,
          schedule: a.schedule,
          faculty: a.faculty,
        })),
        pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
      });
    } catch (error) {
      next(error);
    }
  };

  getMyAllocations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
      }

      const allocations = await prisma.trainerAllocation.findMany({
        where: { faculty_id: userId },
        include: {
          schedule: { select: { batch_id: true, technology: true, start_date: true, end_date: true, venue: true, number_of_participants: true, number_of_days: true, status: true, month: true } },
        },
        orderBy: { allocation_date: 'desc' },
      });

      return res.status(200).json({
        allocations: allocations.map((a) => ({
          allocation_id: a.allocation_id,
          schedule_id: a.schedule_id,
          allocation_status: a.allocation_status,
          allocation_date: a.allocation_date,
          response_date: a.response_date,
          cancellation_reason: a.cancellation_reason,
          schedule: a.schedule,
        })),
      });
    } catch (error) {
      next(error);
    }
  };

  acceptAllocation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
      }

      const { allocationId } = req.params;
      const allocation = await prisma.trainerAllocation.findUnique({ where: { allocation_id: allocationId } });

      if (!allocation) {
        return res.status(404).json({ error: 'Not found', message: 'Allocation not found' });
      }

      if (allocation.faculty_id !== userId) {
        return res.status(403).json({ error: 'Forbidden', message: 'You can only accept your own allocations' });
      }

      if (allocation.allocation_status !== 'PENDING') {
        return res.status(400).json({ error: 'Bad Request', message: 'Only pending allocations can be accepted' });
      }

      const correlationId = uuidv4();
      const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.trainerAllocation.update({
          where: { allocation_id: allocationId },
          data: { allocation_status: 'ACCEPTED', response_date: new Date() },
        });
        await tx.auditLog.create({
          data: {
            action_type: 'ACCEPT',
            entity_type: 'ALLOCATION',
            entity_id: allocationId,
            user_id: userId,
            correlation_id: correlationId,
            before_value: { allocation_status: 'PENDING' },
            after_value: { allocation_status: 'ACCEPTED' },
          },
        });
        return result;
      });

      return res.status(200).json({ success: true, allocation: updated });
    } catch (error) {
      next(error);
    }
  };

  cancelAllocation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
      }

      const { allocationId } = req.params;
      const { cancellation_reason } = req.body;
      const allocation = await prisma.trainerAllocation.findUnique({ where: { allocation_id: allocationId } });

      if (!allocation) {
        return res.status(404).json({ error: 'Not found', message: 'Allocation not found' });
      }

      if (allocation.faculty_id !== userId && req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden', message: 'Not authorized to cancel this allocation' });
      }

      if (allocation.allocation_status === 'CANCELLED') {
        return res.status(400).json({ error: 'Bad Request', message: 'Allocation is already cancelled' });
      }

      const correlationId = uuidv4();
      const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.trainerAllocation.update({
          where: { allocation_id: allocationId },
          data: { allocation_status: 'CANCELLED', response_date: new Date(), cancellation_reason: cancellation_reason || null },
        });
        await tx.auditLog.create({
          data: {
            action_type: 'CANCEL',
            entity_type: 'ALLOCATION',
            entity_id: allocationId,
            user_id: userId,
            correlation_id: correlationId,
            before_value: { allocation_status: allocation.allocation_status },
            after_value: { allocation_status: 'CANCELLED', cancellation_reason },
          },
        });
        return result;
      });

      return res.status(200).json({ success: true, allocation: updated });
    } catch (error) {
      next(error);
    }
  };
}
