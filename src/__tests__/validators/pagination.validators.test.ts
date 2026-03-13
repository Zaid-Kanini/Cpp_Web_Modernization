import { paginationQuerySchema } from '../../validators/pagination.validators';

describe('Pagination Validators', () => {
  describe('paginationQuerySchema', () => {
    it('should use default values when no params provided', () => {
      const result = paginationQuerySchema.parse({});
      expect(result).toMatchObject({
        page: 1,
        limit: 25,
        sort_by: 'start_date',
        order: 'desc',
        include_inactive: false,
      });
    });

    it('should parse valid pagination params', () => {
      const result = paginationQuerySchema.parse({
        page: '2',
        limit: '10',
      });
      expect(result).toMatchObject({
        page: 2,
        limit: 10,
      });
    });

    it('should parse valid sorting params', () => {
      const result = paginationQuerySchema.parse({
        sort_by: 'technology',
        order: 'asc',
      });
      expect(result).toMatchObject({
        sort_by: 'technology',
        order: 'asc',
      });
    });

    it('should parse valid filter params', () => {
      const result = paginationQuerySchema.parse({
        technology: 'React',
        month: 'January',
        status: 'ACTIVE',
      });
      expect(result).toMatchObject({
        technology: 'React',
        month: 'January',
        status: 'ACTIVE',
      });
    });

    it('should cap limit at 100', () => {
      const result = paginationQuerySchema.parse({
        limit: '150',
      });
      expect(result.limit).toBe(100);
    });

    it('should default page to 1 when less than 1', () => {
      const result = paginationQuerySchema.parse({
        page: '0',
      });
      expect(result.page).toBe(1);
    });

    it('should default limit to 25 when less than 1', () => {
      const result = paginationQuerySchema.parse({
        limit: '0',
      });
      expect(result.limit).toBe(25);
    });

    it('should reject invalid sort_by field', () => {
      expect(() => {
        paginationQuerySchema.parse({
          sort_by: 'invalid_field',
        });
      }).toThrow();
    });

    it('should reject invalid order value', () => {
      expect(() => {
        paginationQuerySchema.parse({
          order: 'invalid_order',
        });
      }).toThrow();
    });

    it('should reject invalid status value', () => {
      expect(() => {
        paginationQuerySchema.parse({
          status: 'INVALID_STATUS',
        });
      }).toThrow();
    });

    it('should reject when date_from is after date_to', () => {
      expect(() => {
        paginationQuerySchema.parse({
          date_from: '2024-12-31',
          date_to: '2024-01-01',
        });
      }).toThrow();
    });

    it('should accept when date_from equals date_to', () => {
      const result = paginationQuerySchema.parse({
        date_from: '2024-01-01',
        date_to: '2024-01-01',
      });
      expect(result.date_from).toBe('2024-01-01');
      expect(result.date_to).toBe('2024-01-01');
    });

    it('should parse include_inactive as boolean', () => {
      const result1 = paginationQuerySchema.parse({
        include_inactive: 'true',
      });
      expect(result1.include_inactive).toBe(true);

      const result2 = paginationQuerySchema.parse({
        include_inactive: 'false',
      });
      expect(result2.include_inactive).toBe(false);
    });
  });
});
