import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../app';
import { generateAdminToken, generateFacultyToken } from '../helpers/auth-helper';
import { seedSchedules, clearSchedules } from '../helpers/schedule-seeder';

const prisma = new PrismaClient();

describe('GET /api/v1/schedules - List Schedules', () => {
  let adminToken: string;
  let facultyToken: string;

  beforeAll(async () => {
    adminToken = generateAdminToken('admin-user-id', 'admin@test.com');
    facultyToken = generateFacultyToken('faculty-user-id', 'faculty@test.com');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await clearSchedules();
    await seedSchedules(50);
  });

  afterEach(async () => {
    await clearSchedules();
  });

  describe('Pagination', () => {
    it('should return first page of schedules with default pagination', async () => {
      const response = await request(app)
        .get('/api/v1/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('schedules');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.schedules)).toBe(true);
      expect(response.body.schedules.length).toBeLessThanOrEqual(25);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 25,
      });
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('total_pages');
    });

    it('should return second page of schedules', async () => {
      const response = await request(app)
        .get('/api/v1/schedules?page=2&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(10);
      expect(response.body.schedules.length).toBeLessThanOrEqual(10);
    });

    it('should respect custom limit parameter', async () => {
      const response = await request(app)
        .get('/api/v1/schedules?limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.schedules.length).toBeLessThanOrEqual(10);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should cap limit at 100', async () => {
      const response = await request(app)
        .get('/api/v1/schedules?limit=200')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.pagination.limit).toBe(100);
    });

    it('should handle page beyond total pages gracefully', async () => {
      const response = await request(app)
        .get('/api/v1/schedules?page=999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.schedules).toEqual([]);
      expect(response.body.pagination.page).toBe(999);
    });

    it('should calculate total_pages correctly', async () => {
      const response = await request(app)
        .get('/api/v1/schedules?limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const expectedTotalPages = Math.ceil(response.body.pagination.total / 10);
      expect(response.body.pagination.total_pages).toBe(expectedTotalPages);
    });
  });

  describe('Sorting', () => {
    it('should sort by technology ascending', async () => {
      const response = await request(app)
        .get('/api/v1/schedules?sort_by=technology&order=asc&limit=50')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const technologies = response.body.schedules.map((s: any) => s.technology);
      const sortedTechnologies = [...technologies].sort();
      expect(technologies).toEqual(sortedTechnologies);
    });

    it('should sort by start_date descending (default)', async () => {
      const response = await request(app)
        .get('/api/v1/schedules?limit=50')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const dates = response.body.schedules.map((s: any) => new Date(s.start_date).getTime());
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
      }
    });

    it('should sort by batch_id ascending', async () => {
      const response = await request(app)
        .get('/api/v1/schedules?sort_by=batch_id&order=asc&limit=50')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const batchIds = response.body.schedules.map((s: any) => s.batch_id);
      for (let i = 1; i < batchIds.length; i++) {
        expect(batchIds[i]).toBeGreaterThanOrEqual(batchIds[i - 1]);
      }
    });
  });

  describe('Filtering', () => {
    it('should filter by technology', async () => {
      const response = await request(app)
        .get('/api/v1/schedules?technology=React&limit=50')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.schedules.forEach((schedule: any) => {
        expect(schedule.technology.toLowerCase()).toContain('react');
      });
    });

    it('should filter by month', async () => {
      const response = await request(app)
        .get('/api/v1/schedules?month=January&limit=50')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.schedules.forEach((schedule: any) => {
        expect(schedule.month.toLowerCase()).toContain('january');
      });
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/v1/schedules?status=ACTIVE&limit=50')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.schedules.forEach((schedule: any) => {
        expect(schedule.status).toBe('ACTIVE');
      });
    });

    it('should filter by date range', async () => {
      const currentYear = new Date().getFullYear();
      const dateFrom = `${currentYear}-01-01`;
      const dateTo = `${currentYear}-01-31`;

      const response = await request(app)
        .get(`/api/v1/schedules?date_from=${dateFrom}&date_to=${dateTo}&limit=50`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.schedules.forEach((schedule: any) => {
        const startDate = new Date(schedule.start_date);
        expect(startDate.getTime()).toBeGreaterThanOrEqual(new Date(dateFrom).getTime());
      });
    });

    it('should combine multiple filters', async () => {
      const response = await request(app)
        .get('/api/v1/schedules?technology=React&month=January&status=ACTIVE&limit=50')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.schedules.forEach((schedule: any) => {
        expect(schedule.technology.toLowerCase()).toContain('react');
        expect(schedule.month.toLowerCase()).toContain('january');
        expect(schedule.status).toBe('ACTIVE');
      });
    });

    it('should return only active schedules by default', async () => {
      const response = await request(app)
        .get('/api/v1/schedules?limit=50')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.schedules.forEach((schedule: any) => {
        expect(schedule).not.toHaveProperty('is_active');
      });
    });

    it('should handle case-insensitive filtering', async () => {
      const response = await request(app)
        .get('/api/v1/schedules?technology=react&limit=50')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.schedules.length).toBeGreaterThan(0);
      response.body.schedules.forEach((schedule: any) => {
        expect(schedule.technology.toLowerCase()).toContain('react');
      });
    });
  });

  describe('Combined Operations', () => {
    it('should combine pagination, sorting, and filtering', async () => {
      const response = await request(app)
        .get('/api/v1/schedules?page=1&limit=5&sort_by=start_date&order=desc&technology=React')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.schedules.length).toBeLessThanOrEqual(5);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);

      response.body.schedules.forEach((schedule: any) => {
        expect(schedule.technology.toLowerCase()).toContain('react');
      });

      const dates = response.body.schedules.map((s: any) => new Date(s.start_date).getTime());
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should return empty array when no schedules match filters', async () => {
      const response = await request(app)
        .get('/api/v1/schedules?technology=NonExistentTech')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.schedules).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
      expect(response.body.pagination.total_pages).toBe(0);
    });

    it('should reject invalid date range', async () => {
      const response = await request(app)
        .get('/api/v1/schedules?date_from=2024-12-31&date_to=2024-01-01')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Authorization', () => {
    it('should return 401 when no auth token provided', async () => {
      await request(app)
        .get('/api/v1/schedules')
        .expect(401);
    });

    it('should return 403 when faculty role attempts to list', async () => {
      await request(app)
        .get('/api/v1/schedules')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(403);
    });
  });

  describe('Performance', () => {
    it('should perform efficiently with large dataset', async () => {
      await clearSchedules();
      await seedSchedules(1000);

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/v1/schedules?limit=100')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(500);
      expect(response.body.schedules.length).toBeLessThanOrEqual(100);
      expect(response.body.pagination.total).toBeGreaterThan(900);

      await clearSchedules();
      await seedSchedules(50);
    });
  });
});
