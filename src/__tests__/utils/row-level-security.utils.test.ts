import { addFacultyFilter } from '../../utils/row-level-security.utils';

describe('Row-Level Security Utils', () => {
  describe('addFacultyFilter', () => {
    it('should add user_id to empty query object', () => {
      const userId = '123e4567-e89b-12d3-a456-426614174001';
      const baseQuery = {};

      const result = addFacultyFilter(userId, baseQuery);

      expect(result).toEqual({
        user_id: userId,
      });
    });

    it('should add user_id to existing query object', () => {
      const userId = '123e4567-e89b-12d3-a456-426614174001';
      const baseQuery = {
        is_active: true,
        status: 'APPROVED',
      };

      const result = addFacultyFilter(userId, baseQuery);

      expect(result).toEqual({
        is_active: true,
        status: 'APPROVED',
        user_id: userId,
      });
    });

    it('should preserve all existing query properties', () => {
      const userId = '123e4567-e89b-12d3-a456-426614174001';
      const baseQuery = {
        course_id: 'course-123',
        semester: 'FALL',
        year: 2024,
        is_active: true,
      };

      const result = addFacultyFilter(userId, baseQuery);

      expect(result).toEqual({
        course_id: 'course-123',
        semester: 'FALL',
        year: 2024,
        is_active: true,
        user_id: userId,
      });
    });

    it('should override user_id if already present in base query', () => {
      const userId = '123e4567-e89b-12d3-a456-426614174001';
      const baseQuery = {
        user_id: 'different-user-id',
        is_active: true,
      };

      const result = addFacultyFilter(userId, baseQuery);

      expect(result).toEqual({
        is_active: true,
        user_id: userId,
      });
      expect(result.user_id).toBe(userId);
      expect(result.user_id).not.toBe('different-user-id');
    });

    it('should handle nested query objects', () => {
      const userId = '123e4567-e89b-12d3-a456-426614174001';
      const baseQuery = {
        where: {
          is_active: true,
        },
        include: {
          course: true,
        },
      };

      const result = addFacultyFilter(userId, baseQuery);

      expect(result).toEqual({
        where: {
          is_active: true,
        },
        include: {
          course: true,
        },
        user_id: userId,
      });
    });

    it('should work with Prisma-style query objects', () => {
      const userId = '123e4567-e89b-12d3-a456-426614174001';
      const baseQuery = {
        where: {
          course_id: 'course-123',
          is_active: true,
        },
        orderBy: {
          created_at: 'desc' as const,
        },
        take: 10,
      };

      const result = addFacultyFilter(userId, baseQuery);

      expect(result).toEqual({
        where: {
          course_id: 'course-123',
          is_active: true,
        },
        orderBy: {
          created_at: 'desc',
        },
        take: 10,
        user_id: userId,
      });
    });

    it('should not mutate the original base query object', () => {
      const userId = '123e4567-e89b-12d3-a456-426614174001';
      const baseQuery = {
        is_active: true,
        status: 'APPROVED',
      };

      const originalQuery = { ...baseQuery };
      const result = addFacultyFilter(userId, baseQuery);

      expect(baseQuery).toEqual(originalQuery);
      expect(result).not.toBe(baseQuery);
    });

    it('should handle empty string user_id', () => {
      const userId = '';
      const baseQuery = {
        is_active: true,
      };

      const result = addFacultyFilter(userId, baseQuery);

      expect(result).toEqual({
        is_active: true,
        user_id: '',
      });
    });
  });
});
