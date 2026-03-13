import { Router } from 'express';
import authRoutes from '../auth.routes';
import userRoutes from '../user.routes';
import scheduleRoutes from '../schedule.routes';
import allocationRoutes from '../allocation.routes';
import dashboardRoutes from '../dashboard.routes';
import reportRoutes from '../report.routes';
import auditLogRoutes from '../audit-log.routes';

const router = Router();

// Authentication routes
router.use('/auth', authRoutes);

// User management routes
router.use('/users', userRoutes);

// Schedule management routes
router.use('/schedules', scheduleRoutes);

// Allocation management routes
router.use('/allocations', allocationRoutes);

// Dashboard routes
router.use('/dashboard', dashboardRoutes);

// Report routes
router.use('/reports', reportRoutes);

// Audit log routes
router.use('/audit-logs', auditLogRoutes);

// Placeholder endpoint for testing
router.get('/', (_req, res) => {
  res.json({
    message: 'Training Schedule Management API v1',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      schedules: '/api/v1/schedules',
      allocations: '/api/v1/allocations',
      users: '/api/v1/users',
      dashboard: '/api/v1/dashboard',
      reports: '/api/v1/reports',
      auditLogs: '/api/v1/audit-logs',
    },
    documentation: '/api/v1/docs',
  });
});

export default router;
