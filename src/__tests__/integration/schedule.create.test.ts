import request from 'supertest';
import app from '../../app';
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearDatabase,
  createTestUser,
  prisma,
} from '../helpers/test-setup';
import { generateAdminToken, generateFacultyToken } from '../helpers/auth-helper';

describe('POST /api/v1/schedules - Create Schedule', () => {
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
    await prisma.schedule.deleteMany({});
  });

  const validScheduleData = {
    technology: 'React',
    start_date: '2024-06-10T00:00:00Z',
    end_date: '2024-06-14T00:00:00Z',
    venue: 'Bangalore',
    number_of_participants: 20,
    month: 'June',
  };

  describe('Happy Path - Valid Schedule Creation', () => {
    it('should create schedule with valid data and return 201', async () => {
      const response = await request(app)
        .post('/api/v1/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validScheduleData)
        .expect(201);

      expect(response.body.schedule).toBeDefined();
      expect(response.body.schedule.schedule_id).toBeDefined();
      expect(response.body.schedule.batch_id).toBe(1);
      expect(response.body.schedule.technology).toBe('React');
      expect(response.body.schedule.venue).toBe('Bangalore');
      expect(response.body.schedule.number_of_participants).toBe(20);
      expect(response.body.schedule.month).toBe('June');
      expect(response.body.schedule.number_of_days).toBe(5);
      expect(response.body.schedule.status).toBe('ACTIVE');
    });

    it('should auto-generate batch_id when not provided', async () => {
      const response1 = await request(app)
        .post('/api/v1/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validScheduleData)
        .expect(201);

      expect(response1.body.schedule.batch_id).toBe(1);

      const response2 = await request(app)
        .post('/api/v1/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validScheduleData, technology: 'Node.js' })
        .expect(201);

      expect(response2.body.schedule.batch_id).toBe(2);
    });

    it('should use provided batch_id when valid', async () => {
      const response = await request(app)
        .post('/api/v1/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validScheduleData, batch_id: 100 })
        .expect(201);

      expect(response.body.schedule.batch_id).toBe(100);
    });

    it('should calculate number_of_days correctly (exclude weekends)', async () => {
      const response = await request(app)
        .post('/api/v1/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validScheduleData,
          start_date: '2024-06-10T00:00:00Z',
          end_date: '2024-06-16T00:00:00Z',
        })
        .expect(201);

      expect(response.body.schedule.number_of_days).toBe(5);
    });

    it('should create audit log entry in same transaction', async () => {
      const response = await request(app)
        .post('/api/v1/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validScheduleData)
        .expect(201);

      const auditLogs = await prisma.auditLog.findMany({
        where: {
          entity_id: response.body.schedule.schedule_id,
          action_type: 'CREATE',
        },
      });

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].user_id).toBe(adminUser.user_id);
      expect(auditLogs[0].entity_type).toBe('SCHEDULE');
    });
  });

  describe('Validation Tests - Date Validation', () => {
    it('should return 400 for invalid date format', async () => {
      const response = await request(app)
        .post('/api/v1/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validScheduleData, start_date: 'invalid-date' })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
    });

    it('should return 400 for start_date > end_date', async () => {
      const response = await request(app)
        .post('/api/v1/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validScheduleData,
          start_date: '2024-06-20T00:00:00Z',
          end_date: '2024-06-10T00:00:00Z',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for dates outside allowed range (before current year)', async () => {
      const response = await request(app)
        .post('/api/v1/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validScheduleData,
          start_date: '2020-06-10T00:00:00Z',
          end_date: '2020-06-14T00:00:00Z',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for dates outside allowed range (after current year + 5)', async () => {
      const futureYear = new Date().getFullYear() + 6;
      const response = await request(app)
        .post('/api/v1/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validScheduleData,
          start_date: `${futureYear}-06-10T00:00:00Z`,
          end_date: `${futureYear}-06-14T00:00:00Z`,
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Validation Tests - Alphabetic Field Validation', () => {
    it('should return 400 for non-alphabetic technology', async () => {
      const response = await request(app)
        .post('/api/v1/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validScheduleData, technology: 'React123' })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details.some((d: any) => d.field === 'technology')).toBe(true);
    });

    it('should return 400 for non-alphabetic venue', async () => {
      const response = await request(app)
        .post('/api/v1/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validScheduleData, venue: 'Bangalore@123' })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details.some((d: any) => d.field === 'venue')).toBe(true);
    });

    it('should return 400 for non-alphabetic month', async () => {
      const response = await request(app)
        .post('/api/v1/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validScheduleData, month: 'June2024' })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details.some((d: any) => d.field === 'month')).toBe(true);
    });
  });

  describe('Validation Tests - Required Fields', () => {
    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ technology: 'React' })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details.length).toBeGreaterThan(0);
    });

    it('should return 400 for empty strings', async () => {
      const response = await request(app)
        .post('/api/v1/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validScheduleData, technology: '' })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for technology > 100 chars', async () => {
      const response = await request(app)
        .post('/api/v1/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validScheduleData, technology: 'A'.repeat(101) })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Authorization Tests', () => {
    it('should return 401 when no auth token provided', async () => {
      await request(app)
        .post('/api/v1/schedules')
        .send(validScheduleData)
        .expect(401);
    });

    it('should return 403 when faculty role attempts creation', async () => {
      await request(app)
        .post('/api/v1/schedules')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send(validScheduleData)
        .expect(403);
    });
  });

  describe('Business Logic Tests', () => {
    it('should return 400 for duplicate batch_id', async () => {
      await request(app)
        .post('/api/v1/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validScheduleData, batch_id: 50 })
        .expect(201);

      const response = await request(app)
        .post('/api/v1/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validScheduleData, technology: 'Node.js', batch_id: 50 })
        .expect(400);

      expect(response.body.message).toContain('Batch ID already exists');
    });

    it('should handle single-day schedule on weekday', async () => {
      const response = await request(app)
        .post('/api/v1/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validScheduleData,
          start_date: '2024-06-10T00:00:00Z',
          end_date: '2024-06-10T00:00:00Z',
        })
        .expect(201);

      expect(response.body.schedule.number_of_days).toBe(1);
    });

    it('should handle weekend-only schedule (returns 0 business days)', async () => {
      const response = await request(app)
        .post('/api/v1/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validScheduleData,
          start_date: '2024-06-15T00:00:00Z',
          end_date: '2024-06-16T00:00:00Z',
        })
        .expect(201);

      expect(response.body.schedule.number_of_days).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle schedule spanning multiple weeks', async () => {
      const response = await request(app)
        .post('/api/v1/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validScheduleData,
          start_date: '2024-06-03T00:00:00Z',
          end_date: '2024-06-21T00:00:00Z',
        })
        .expect(201);

      expect(response.body.schedule.number_of_days).toBe(15);
    });

    it('should accept alphabetic fields with spaces', async () => {
      const response = await request(app)
        .post('/api/v1/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validScheduleData,
          technology: 'React Native',
          venue: 'New York',
        })
        .expect(201);

      expect(response.body.schedule.technology).toBe('React Native');
      expect(response.body.schedule.venue).toBe('New York');
    });
  });
});
