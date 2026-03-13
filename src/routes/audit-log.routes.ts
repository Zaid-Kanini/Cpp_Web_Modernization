import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/rbac.middleware';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', requireAuth as any, requireAdmin as any, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { action_type, entity_type, user_id, start_date, end_date, page = '1', limit = '20' } = _req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (action_type) where.action_type = action_type as string;
    if (entity_type) where.entity_type = entity_type as string;
    if (user_id) where.user_id = user_id as string;
    if (start_date || end_date) {
      where.timestamp = {};
      if (start_date) where.timestamp.gte = new Date(start_date as string);
      if (end_date) where.timestamp.lte = new Date(end_date as string);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { first_name: true, last_name: true, email: true } },
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      logs: logs.map((log) => ({
        log_id: log.log_id,
        timestamp: log.timestamp,
        user_id: log.user_id,
        user_name: log.user ? `${log.user.first_name} ${log.user.last_name}` : 'System',
        user_email: log.user?.email || null,
        action_type: log.action_type,
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        before_value: log.before_value,
        after_value: log.after_value,
        ip_address: log.ip_address,
        correlation_id: log.correlation_id,
      })),
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
