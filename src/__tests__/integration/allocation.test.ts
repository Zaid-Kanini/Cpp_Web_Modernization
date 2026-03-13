import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../app';
import { generateToken } from '../../utils/jwt.utils';
import * as emailService from '../../services/email.service';

const prisma = new PrismaClient();

jest.mock('../../services/email.service', () => ({
  sendAllocationNotification: jest.fn().mockResolvedValue(undefined),
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
}));

describe('Allocation Integration Tests', () => {
  let adminToken: string;
  let facultyToken: string;
  let adminUserId: string;
  let facultyUserId: string;
  let scheduleId1: string;
  let scheduleId2: string;
  let overlappingScheduleId: string;

  beforeAll(async () => {
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin-allocation@test.com',
        password_hash: 'hashed_password',
        role: 'ADMIN',
        first_name: 'Admin',
        last_name: 'User',
        technology_specializations: ['Java', 'Python'],
      },
    });

    const facultyUser = await prisma.user.create({
      data: {
        email: 'faculty-allocation@test.com',
        password_hash: 'hashed_password',
        role: 'FACULTY',
        first_name: 'Faculty',
        last_name: 'Member',
        technology_specializations: ['JavaScript', 'React'],
      },
    });

    adminUserId = adminUser.user_id;
    facultyUserId = facultyUser.user_id;

    adminToken = generateToken({
      user_id: adminUserId,
      email: adminUser.email,
      role: adminUser.role,
    });

    facultyToken = generateToken({
      user_id: facultyUserId,
      email: facultyUser.email,
      role: facultyUser.role,
    });

    const schedule1 = await prisma.schedule.create({
      data: {
        batch_id: 9001,
        technology: 'JavaScript',
        start_date: new Date('2025-06-01'),
        end_date: new Date('2025-06-15'),
        number_of_days: 10,
        venue: 'Room A',
        number_of_participants: 20,
        month: 'June',
        created_by: adminUserId,
      },
    });

    const schedule2 = await prisma.schedule.create({
      data: {
        batch_id: 9002,
        technology: 'React',
        start_date: new Date('2025-07-01'),
        end_date: new Date('2025-07-15'),
        number_of_days: 10,
        venue: 'Room B',
        number_of_participants: 15,
        month: 'July',
        created_by: adminUserId,
      },
    });

    const overlappingSchedule = await prisma.schedule.create({
      data: {
        batch_id: 9003,
        technology: 'Node.js',
        start_date: new Date('2025-06-10'),
        end_date: new Date('2025-06-25'),
        number_of_days: 12,
        venue: 'Room C',
        number_of_participants: 18,
        month: 'June',
        created_by: adminUserId,
      },
    });

    scheduleId1 = schedule1.schedule_id;
    scheduleId2 = schedule2.schedule_id;
    overlappingScheduleId = overlappingSchedule.schedule_id;
  });

  afterAll(async () => {
    await prisma.trainerAllocation.deleteMany({
      where: {
        OR: [
          { faculty_id: facultyUserId },
          { allocated_by: adminUserId },
        ],
      },
    });

    await prisma.auditLog.deleteMany({
      where: {
        user_id: { in: [adminUserId, facultyUserId] },
      },
    });

    await prisma.schedule.deleteMany({
      where: {
        batch_id: { in: [9001, 9002, 9003] },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: { in: ['admin-allocation@test.com', 'faculty-allocation@test.com'] },
      },
    });

    await prisma.$disconnect();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/allocations', () => {
    it('should create allocation successfully with valid data (201)', async () => {
      const response = await request(app)
        .post('/api/v1/allocations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          faculty_id: facultyUserId,
          schedule_ids: [scheduleId1],
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('All allocations created successfully');
      expect(response.body.allocations).toHaveLength(1);
      expect(response.body.allocations[0]).toMatchObject({
        faculty_id: facultyUserId,
        schedule_id: scheduleId1,
        allocation_status: 'PENDING',
      });

      expect(emailService.sendAllocationNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'faculty-allocation@test.com',
          firstName: 'Faculty',
          lastName: 'Member',
        })
      );

      const allocation = await prisma.trainerAllocation.findUnique({
        where: {
          schedule_id_faculty_id: {
            schedule_id: scheduleId1,
            faculty_id: facultyUserId,
          },
        },
      });

      expect(allocation).not.toBeNull();
      expect(allocation?.allocation_status).toBe('PENDING');

      const auditLog = await prisma.auditLog.findFirst({
        where: {
          entity_type: 'ALLOCATION',
          entity_id: allocation?.allocation_id,
          action_type: 'CREATE',
        },
      });

      expect(auditLog).not.toBeNull();
    });

    it('should return 207 Multi-Status for partial success with conflicts', async () => {
      const response = await request(app)
        .post('/api/v1/allocations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          faculty_id: facultyUserId,
          schedule_ids: [scheduleId2, overlappingScheduleId],
        });

      expect(response.status).toBe(207);
      expect(response.body.message).toContain('Partial success');
      expect(response.body.allocations).toHaveLength(1);
      expect(response.body.conflicts).toHaveLength(1);
      expect(response.body.conflicts[0].reason).toContain('overlaps');
    });

    it('should prevent duplicate allocations', async () => {
      const response = await request(app)
        .post('/api/v1/allocations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          faculty_id: facultyUserId,
          schedule_ids: [scheduleId1],
        });

      expect(response.status).toBe(400);
      expect(response.body.conflicts).toHaveLength(1);
      expect(response.body.conflicts[0].reason).toContain('already allocated');
    });

    it('should return 400 for invalid faculty_id format', async () => {
      const response = await request(app)
        .post('/api/v1/allocations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          faculty_id: 'invalid-uuid',
          schedule_ids: [scheduleId1],
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for empty schedule_ids array', async () => {
      const response = await request(app)
        .post('/api/v1/allocations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          faculty_id: facultyUserId,
          schedule_ids: [],
        });

      expect(response.status).toBe(400);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/v1/allocations')
        .send({
          faculty_id: facultyUserId,
          schedule_ids: [scheduleId1],
        });

      expect(response.status).toBe(401);
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .post('/api/v1/allocations')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          faculty_id: facultyUserId,
          schedule_ids: [scheduleId1],
        });

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent faculty', async () => {
      const response = await request(app)
        .post('/api/v1/allocations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          faculty_id: '00000000-0000-0000-0000-000000000000',
          schedule_ids: [scheduleId1],
        });

      expect(response.status).toBe(404);
    });

    it('should return 404 for non-existent schedule', async () => {
      const response = await request(app)
        .post('/api/v1/allocations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          faculty_id: facultyUserId,
          schedule_ids: ['00000000-0000-0000-0000-000000000000'],
        });

      expect(response.status).toBe(404);
    });
  });
});
