import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/stats', requireAuth as any, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalSchedules,
      activeSchedules,
      completedSchedules,
      cancelledSchedules,
      totalFaculty,
      activeFaculty,
      pendingAllocations,
      acceptedAllocations,
    ] = await Promise.all([
      prisma.schedule.count({ where: { is_active: true } }),
      prisma.schedule.count({ where: { is_active: true, status: 'ACTIVE' } }),
      prisma.schedule.count({ where: { is_active: true, status: 'COMPLETED' } }),
      prisma.schedule.count({ where: { is_active: true, status: 'CANCELLED' } }),
      prisma.user.count({ where: { role: 'FACULTY' } }),
      prisma.user.count({ where: { role: 'FACULTY', is_active: true } }),
      prisma.trainerAllocation.count({ where: { allocation_status: 'PENDING' } }),
      prisma.trainerAllocation.count({ where: { allocation_status: 'ACCEPTED' } }),
    ]);

    const completionRate = totalSchedules > 0
      ? Math.round((completedSchedules / totalSchedules) * 100)
      : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalSchedules,
        activeSchedules,
        completedSchedules,
        cancelledSchedules,
        totalFaculty,
        activeFaculty,
        pendingAllocations,
        acceptedAllocations,
        completionRate,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
