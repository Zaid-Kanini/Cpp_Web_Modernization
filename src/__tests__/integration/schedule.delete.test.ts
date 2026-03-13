import request from 'supertest';
import app from '../../app';
import {
  setupTestDatabase,
  teardownTestDatabase,
  createTestUser,
  prisma,
} from '../helpers/test-setup';
import { generateAdminToken, generateFacultyToken } from '../helpers/auth-helper';
import { v4 as uuidv4 } from 'uuid';

describe('DELETE /api/v1/schedules/:scheduleId - Soft Delete Schedule', () => {
  let adminUser: any;
  let facultyUser: any;
  let adminToken: string;
  let facultyToken: string;

  beforeAll(async () => {
    await setupTestDatabase();
    adminUser = await createTestUser('admin@test.com', 'ADMIN');
    facultyUser = await createTestUser('faculty@test.com', 'FACULTY');
    adminToken = generateAdminToken(adminUser.user_id, adminUser.email);
    facultyToken = generateFacultyToken(facultyUser.user_id, facultyUser.email);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  afterEach(async () => {
    await prisma.auditLog.deleteMany({});
    await prisma.trainerAllocation.deleteMany({});
    await prisma.schedule.deleteMany({});
  });

  const createTestSchedule = async () => {
    return await prisma.schedule.create({
      data: {
        batch_id: Math.floor(Math.random() * 100000),
        technology: 'React',
        start_date: new Date('2024-06-10'),
        end_date: new Date('2024-06-14'),
        number_of_days: 5,
        venue: 'Bangalore',
        number_of_participants: 20,
        month: 'June',
        created_by: adminUser.user_id,
      },
    });
  };

  describe('Happy Path - Successful Soft Delete', () => {
    it('should soft delete schedule and return 204 No Content', async () => {
      const schedule = await createTestSchedule();

      const response = await request(app)
        .delete(`/api/v1/schedules/${schedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      expect(response.body).toEqual({});
    });

    it('should set is_active to false in database', async () => {
      const schedule = await createTestSchedule();

      await request(app)
        .delete(`/api/v1/schedules/${schedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      const deletedSchedule = await prisma.schedule.findUnique({
        where: { schedule_id: schedule.schedule_id },
      });

      expect(deletedSchedule).not.toBeNull();
      expect(deletedSchedule?.is_active).toBe(false);
    });

    it('should not physically delete schedule from database', async () => {
      const schedule = await createTestSchedule();

      await request(app)
        .delete(`/api/v1/schedules/${schedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      const scheduleInDb = await prisma.schedule.findUnique({
        where: { schedule_id: schedule.schedule_id },
      });

      expect(scheduleInDb).not.toBeNull();
      expect(scheduleInDb?.is_active).toBe(false);
    });
  });

  describe('Soft Delete Verification', () => {
    it('should exclude deleted schedule from default list query', async () => {
      const schedule = await createTestSchedule();

      await request(app)
        .delete(`/api/v1/schedules/${schedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      const listResponse = await request(app)
        .get('/api/v1/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const scheduleIds = listResponse.body.schedules.map((s: any) => s.schedule_id);
      expect(scheduleIds).not.toContain(schedule.schedule_id);
    });

    it('should exclude deleted schedule from GET by ID', async () => {
      const schedule = await createTestSchedule();

      await request(app)
        .delete(`/api/v1/schedules/${schedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      await request(app)
        .get(`/api/v1/schedules/${schedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('Audit Log Tests', () => {
    it('should create audit log entry for deletion', async () => {
      const schedule = await createTestSchedule();

      await request(app)
        .delete(`/api/v1/schedules/${schedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      const auditLog = await prisma.auditLog.findFirst({
        where: {
          entity_id: schedule.schedule_id,
          action_type: 'DELETE',
        },
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog?.entity_type).toBe('SCHEDULE');
      expect(auditLog?.user_id).toBe(adminUser.user_id);
      expect(auditLog?.before_value).toBeDefined();
    });

    it('should include schedule data in audit log before_value', async () => {
      const schedule = await createTestSchedule();

      await request(app)
        .delete(`/api/v1/schedules/${schedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      const auditLog = await prisma.auditLog.findFirst({
        where: {
          entity_id: schedule.schedule_id,
          action_type: 'DELETE',
        },
      });

      const beforeValue = auditLog?.before_value as any;
      expect(beforeValue.batch_id).toBe(schedule.batch_id);
      expect(beforeValue.technology).toBe(schedule.technology);
      expect(beforeValue.venue).toBe(schedule.venue);
    });
  });

  describe('Referential Integrity Tests', () => {
    it('should preserve related allocations after deletion', async () => {
      const schedule = await createTestSchedule();

      const allocation = await prisma.trainerAllocation.create({
        data: {
          schedule_id: schedule.schedule_id,
          faculty_id: facultyUser.user_id,
          allocation_date: new Date('2024-06-10'),
          allocation_status: 'ACCEPTED',
          allocated_by: adminUser.user_id,
        },
      });

      await request(app)
        .delete(`/api/v1/schedules/${schedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      const allocations = await prisma.trainerAllocation.findMany({
        where: { schedule_id: schedule.schedule_id },
      });

      expect(allocations).toHaveLength(1);
      expect(allocations[0].allocation_id).toBe(allocation.allocation_id);
    });
  });

  describe('Error Cases - Already Deleted', () => {
    it('should return 404 when deleting already deleted schedule', async () => {
      const schedule = await createTestSchedule();

      await request(app)
        .delete(`/api/v1/schedules/${schedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      const response = await request(app)
        .delete(`/api/v1/schedules/${schedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.error).toBe('Not found');
      expect(response.body.message).toBe('Schedule not found or already deleted');
    });
  });

  describe('Error Cases - Not Found', () => {
    it('should return 404 when deleting non-existent schedule', async () => {
      const nonExistentId = uuidv4();

      const response = await request(app)
        .delete(`/api/v1/schedules/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.error).toBe('Not found');
      expect(response.body.message).toBe('Schedule not found or already deleted');
    });
  });

  describe('Error Cases - Invalid ID Format', () => {
    it('should return 400 for invalid schedule ID format', async () => {
      const response = await request(app)
        .delete('/api/v1/schedules/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBe('Invalid schedule ID format');
    });

    it('should return 400 for numeric ID instead of UUID', async () => {
      const response = await request(app)
        .delete('/api/v1/schedules/12345')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBe('Invalid schedule ID format');
    });
  });

  describe('Authorization Tests', () => {
    it('should return 401 when no auth token provided', async () => {
      const schedule = await createTestSchedule();

      const response = await request(app)
        .delete(`/api/v1/schedules/${schedule.schedule_id}`)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should return 403 when faculty role attempts deletion', async () => {
      const schedule = await createTestSchedule();

      const response = await request(app)
        .delete(`/api/v1/schedules/${schedule.schedule_id}`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(403);

      expect(response.body.error).toBeDefined();
    });

    it('should not delete schedule when faculty attempts deletion', async () => {
      const schedule = await createTestSchedule();

      await request(app)
        .delete(`/api/v1/schedules/${schedule.schedule_id}`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(403);

      const scheduleInDb = await prisma.schedule.findUnique({
        where: { schedule_id: schedule.schedule_id },
      });

      expect(scheduleInDb?.is_active).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent deletion attempts gracefully', async () => {
      const schedule = await createTestSchedule();

      const [response1, response2] = await Promise.all([
        request(app)
          .delete(`/api/v1/schedules/${schedule.schedule_id}`)
          .set('Authorization', `Bearer ${adminToken}`),
        request(app)
          .delete(`/api/v1/schedules/${schedule.schedule_id}`)
          .set('Authorization', `Bearer ${adminToken}`),
      ]);

      const successCount = [response1.status, response2.status].filter(
        (status) => status === 204
      ).length;
      const notFoundCount = [response1.status, response2.status].filter(
        (status) => status === 404
      ).length;

      expect(successCount).toBe(1);
      expect(notFoundCount).toBe(1);
    });

    it('should maintain version number after soft delete', async () => {
      const schedule = await createTestSchedule();
      const originalVersion = schedule.version;

      await request(app)
        .delete(`/api/v1/schedules/${schedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      const deletedSchedule = await prisma.schedule.findUnique({
        where: { schedule_id: schedule.schedule_id },
      });

      expect(deletedSchedule?.version).toBe(originalVersion);
    });
  });

  describe('Data Integrity', () => {
    it('should preserve all schedule fields after soft delete', async () => {
      const schedule = await createTestSchedule();

      await request(app)
        .delete(`/api/v1/schedules/${schedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      const deletedSchedule = await prisma.schedule.findUnique({
        where: { schedule_id: schedule.schedule_id },
      });

      expect(deletedSchedule?.batch_id).toBe(schedule.batch_id);
      expect(deletedSchedule?.technology).toBe(schedule.technology);
      expect(deletedSchedule?.venue).toBe(schedule.venue);
      expect(deletedSchedule?.number_of_participants).toBe(schedule.number_of_participants);
      expect(deletedSchedule?.month).toBe(schedule.month);
      expect(deletedSchedule?.status).toBe(schedule.status);
    });
  });
});
