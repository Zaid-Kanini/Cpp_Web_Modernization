import request from 'supertest';
import app from '../../app';
import {
  setupTestDatabase,
  teardownTestDatabase,
  createTestUser,
  prisma,
} from '../helpers/test-setup';
import { generateAdminToken, generateFacultyToken } from '../helpers/auth-helper';

describe('PATCH /api/v1/schedules/:id - Update Schedule with Optimistic Locking', () => {
  let adminUser: any;
  let facultyUser: any;
  let adminToken: string;
  let facultyToken: string;
  let testSchedule: any;

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

  beforeEach(async () => {
    testSchedule = await prisma.schedule.create({
      data: {
        batch_id: 1,
        technology: 'React',
        start_date: new Date('2024-06-10'),
        end_date: new Date('2024-06-14'),
        number_of_days: 5,
        venue: 'Bangalore',
        number_of_participants: 20,
        month: 'June',
        status: 'ACTIVE',
        version: 1,
        created_by: adminUser.user_id,
      },
    });
  });

  afterEach(async () => {
    await prisma.auditLog.deleteMany({});
    await prisma.schedule.deleteMany({});
  });

  describe('Happy Path - Successful Updates', () => {
    it('should update schedule with valid data and correct version', async () => {
      const response = await request(app)
        .patch(`/api/v1/schedules/${testSchedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          version: 1,
          technology: 'Angular',
        })
        .expect(200);

      expect(response.body.schedule).toBeDefined();
      expect(response.body.schedule.technology).toBe('Angular');
      expect(response.body.schedule.version).toBe(2);
      expect(response.body.schedule.venue).toBe('Bangalore');
    });

    it('should return updated schedule with incremented version', async () => {
      const response = await request(app)
        .patch(`/api/v1/schedules/${testSchedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          version: 1,
          venue: 'Mumbai',
        })
        .expect(200);

      expect(response.body.schedule.version).toBe(2);
      expect(response.body.schedule.venue).toBe('Mumbai');
    });

    it('should update only technology field (partial update)', async () => {
      const response = await request(app)
        .patch(`/api/v1/schedules/${testSchedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          version: 1,
          technology: 'Vue',
        })
        .expect(200);

      expect(response.body.schedule.technology).toBe('Vue');
      expect(response.body.schedule.venue).toBe('Bangalore');
      expect(response.body.schedule.number_of_participants).toBe(20);
    });

    it('should update only venue field (partial update)', async () => {
      const response = await request(app)
        .patch(`/api/v1/schedules/${testSchedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          version: 1,
          venue: 'Chennai',
        })
        .expect(200);

      expect(response.body.schedule.venue).toBe('Chennai');
      expect(response.body.schedule.technology).toBe('React');
    });

    it('should update multiple fields in one request', async () => {
      const response = await request(app)
        .patch(`/api/v1/schedules/${testSchedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          version: 1,
          technology: 'Node.js',
          venue: 'Hyderabad',
          number_of_participants: 30,
        })
        .expect(200);

      expect(response.body.schedule.technology).toBe('Node.js');
      expect(response.body.schedule.venue).toBe('Hyderabad');
      expect(response.body.schedule.number_of_participants).toBe(30);
      expect(response.body.schedule.version).toBe(2);
    });

    it('should allow update with only version (no changes)', async () => {
      const response = await request(app)
        .patch(`/api/v1/schedules/${testSchedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          version: 1,
        })
        .expect(200);

      expect(response.body.schedule.version).toBe(2);
      expect(response.body.schedule.technology).toBe('React');
    });
  });

  describe('Date Recalculation', () => {
    it('should recalculate number_of_days when start_date changes', async () => {
      const response = await request(app)
        .patch(`/api/v1/schedules/${testSchedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          version: 1,
          start_date: '2024-06-11',
        })
        .expect(200);

      expect(response.body.schedule.number_of_days).toBe(4);
    });

    it('should recalculate number_of_days when end_date changes', async () => {
      const response = await request(app)
        .patch(`/api/v1/schedules/${testSchedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          version: 1,
          end_date: '2024-06-20',
        })
        .expect(200);

      expect(response.body.schedule.number_of_days).toBe(9);
    });

    it('should recalculate number_of_days when both dates change', async () => {
      const response = await request(app)
        .patch(`/api/v1/schedules/${testSchedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          version: 1,
          start_date: '2024-07-01',
          end_date: '2024-07-05',
        })
        .expect(200);

      expect(response.body.schedule.number_of_days).toBe(5);
    });

    it('should preserve number_of_days when dates not changed', async () => {
      const response = await request(app)
        .patch(`/api/v1/schedules/${testSchedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          version: 1,
          technology: 'Angular',
        })
        .expect(200);

      expect(response.body.schedule.number_of_days).toBe(5);
    });
  });

  describe('Version Conflict Detection', () => {
    it('should return 409 Conflict when version mismatches', async () => {
      const response = await request(app)
        .patch(`/api/v1/schedules/${testSchedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          version: 999,
          technology: 'Angular',
        })
        .expect(409);

      expect(response.body.statusCode).toBe(409);
      expect(response.body.latestVersion).toBe(1);
      expect(response.body.message).toContain('Version conflict');
    });

    it('should include latest version in 409 Conflict response', async () => {
      await request(app)
        .patch(`/api/v1/schedules/${testSchedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          version: 1,
          technology: 'Angular',
        })
        .expect(200);

      const response = await request(app)
        .patch(`/api/v1/schedules/${testSchedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          version: 1,
          technology: 'Vue',
        })
        .expect(409);

      expect(response.body.latestVersion).toBe(2);
    });

    it('should handle concurrent updates correctly (race condition)', async () => {
      const updatePromises = [
        request(app)
          .patch(`/api/v1/schedules/${testSchedule.schedule_id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            version: 1,
            technology: 'Angular',
          }),
        request(app)
          .patch(`/api/v1/schedules/${testSchedule.schedule_id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            version: 1,
            technology: 'Vue',
          }),
      ];

      const results = await Promise.all(updatePromises);

      const successResponses = results.filter((r) => r.status === 200);
      const conflictResponses = results.filter((r) => r.status === 409);

      expect(successResponses.length).toBe(1);
      expect(conflictResponses.length).toBe(1);
      expect(conflictResponses[0].body.latestVersion).toBe(2);
    });
  });

  describe('Audit Log Creation', () => {
    it('should create audit log entry with before/after values', async () => {
      await request(app)
        .patch(`/api/v1/schedules/${testSchedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          version: 1,
          technology: 'Angular',
          venue: 'Mumbai',
        })
        .expect(200);

      const auditLogs = await prisma.auditLog.findMany({
        where: {
          entity_id: testSchedule.schedule_id,
          action_type: 'UPDATE',
        },
      });

      expect(auditLogs.length).toBe(1);
      expect(auditLogs[0].before_value).toBeDefined();
      expect(auditLogs[0].after_value).toBeDefined();
      expect((auditLogs[0].before_value as any).technology).toBe('React');
      expect((auditLogs[0].after_value as any).technology).toBe('Angular');
      expect((auditLogs[0].after_value as any).venue).toBe('Mumbai');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 Not Found for non-existent schedule', async () => {
      const response = await request(app)
        .patch('/api/v1/schedules/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          version: 1,
          technology: 'Angular',
        })
        .expect(404);

      expect(response.body.statusCode).toBe(404);
      expect(response.body.message).toContain('not found');
    });

    it('should return 400 for missing version field', async () => {
      const response = await request(app)
        .patch(`/api/v1/schedules/${testSchedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          technology: 'Angular',
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
    });

    it('should return 400 for invalid version (zero)', async () => {
      const response = await request(app)
        .patch(`/api/v1/schedules/${testSchedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          version: 0,
          technology: 'Angular',
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
    });

    it('should return 400 for invalid version (negative)', async () => {
      const response = await request(app)
        .patch(`/api/v1/schedules/${testSchedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          version: -1,
          technology: 'Angular',
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
    });

    it('should return 400 for invalid date format', async () => {
      const response = await request(app)
        .patch(`/api/v1/schedules/${testSchedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          version: 1,
          start_date: 'invalid-date',
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
    });

    it('should return 400 for start_date > end_date', async () => {
      const response = await request(app)
        .patch(`/api/v1/schedules/${testSchedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          version: 1,
          start_date: '2024-06-20',
          end_date: '2024-06-10',
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
    });

    it('should validate alphabetic fields (technology)', async () => {
      const response = await request(app)
        .patch(`/api/v1/schedules/${testSchedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          version: 1,
          technology: 'React123',
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
    });

    it('should validate alphabetic fields (venue)', async () => {
      const response = await request(app)
        .patch(`/api/v1/schedules/${testSchedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          version: 1,
          venue: 'Bangalore@123',
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
    });
  });

  describe('Authorization', () => {
    it('should return 401 when no auth token provided', async () => {
      await request(app)
        .patch(`/api/v1/schedules/${testSchedule.schedule_id}`)
        .send({
          version: 1,
          technology: 'Angular',
        })
        .expect(401);
    });

    it('should return 403 when faculty role attempts update', async () => {
      await request(app)
        .patch(`/api/v1/schedules/${testSchedule.schedule_id}`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          version: 1,
          technology: 'Angular',
        })
        .expect(403);
    });
  });

  describe('Edge Cases', () => {
    it('should handle update with no actual changes (same values)', async () => {
      const response = await request(app)
        .patch(`/api/v1/schedules/${testSchedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          version: 1,
          technology: 'React',
          venue: 'Bangalore',
        })
        .expect(200);

      expect(response.body.schedule.version).toBe(2);
      expect(response.body.schedule.technology).toBe('React');
    });

    it('should handle deleted schedule', async () => {
      await prisma.schedule.update({
        where: { schedule_id: testSchedule.schedule_id },
        data: { is_active: false },
      });

      const response = await request(app)
        .patch(`/api/v1/schedules/${testSchedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          version: 1,
          technology: 'Angular',
        })
        .expect(404);

      expect(response.body.message).toContain('deleted');
    });

    it('should handle status update', async () => {
      const response = await request(app)
        .patch(`/api/v1/schedules/${testSchedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          version: 1,
          status: 'COMPLETED',
        })
        .expect(200);

      expect(response.body.schedule.status).toBe('COMPLETED');
      expect(response.body.schedule.version).toBe(2);
    });

    it('should handle sequential updates with correct version tracking', async () => {
      const response1 = await request(app)
        .patch(`/api/v1/schedules/${testSchedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          version: 1,
          technology: 'Angular',
        })
        .expect(200);

      expect(response1.body.schedule.version).toBe(2);

      const response2 = await request(app)
        .patch(`/api/v1/schedules/${testSchedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          version: 2,
          venue: 'Mumbai',
        })
        .expect(200);

      expect(response2.body.schedule.version).toBe(3);

      const response3 = await request(app)
        .patch(`/api/v1/schedules/${testSchedule.schedule_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          version: 3,
          number_of_participants: 25,
        })
        .expect(200);

      expect(response3.body.schedule.version).toBe(4);
    });
  });
});
