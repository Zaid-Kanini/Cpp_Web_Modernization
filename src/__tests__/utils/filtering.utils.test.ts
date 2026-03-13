import { buildWhereClause } from '../../utils/filtering.utils';

describe('Filtering Utils', () => {
  describe('buildWhereClause', () => {
    it('should include is_active true by default', () => {
      const where = buildWhereClause({});
      expect(where).toEqual({ is_active: true });
    });

    it('should filter by technology with case-insensitive search', () => {
      const where = buildWhereClause({ technology: 'React' });
      expect(where).toEqual({
        is_active: true,
        technology: {
          contains: 'React',
          mode: 'insensitive',
        },
      });
    });

    it('should filter by month with case-insensitive search', () => {
      const where = buildWhereClause({ month: 'January' });
      expect(where).toEqual({
        is_active: true,
        month: {
          contains: 'January',
          mode: 'insensitive',
        },
      });
    });

    it('should filter by status', () => {
      const where = buildWhereClause({ status: 'ACTIVE' });
      expect(where).toEqual({
        is_active: true,
        status: 'ACTIVE',
      });
    });

    it('should filter by date_from', () => {
      const dateFrom = '2024-01-01';
      const where = buildWhereClause({ date_from: dateFrom });
      expect(where).toEqual({
        is_active: true,
        start_date: {
          gte: new Date(dateFrom),
        },
      });
    });

    it('should filter by date_to', () => {
      const dateTo = '2024-01-31';
      const where = buildWhereClause({ date_to: dateTo });
      expect(where).toEqual({
        is_active: true,
        end_date: {
          lte: new Date(dateTo),
        },
      });
    });

    it('should filter by date range', () => {
      const dateFrom = '2024-01-01';
      const dateTo = '2024-01-31';
      const where = buildWhereClause({ date_from: dateFrom, date_to: dateTo });
      expect(where).toEqual({
        is_active: true,
        start_date: {
          gte: new Date(dateFrom),
        },
        end_date: {
          lte: new Date(dateTo),
        },
      });
    });

    it('should combine multiple filters', () => {
      const where = buildWhereClause({
        technology: 'React',
        month: 'January',
        status: 'ACTIVE',
      });
      expect(where).toEqual({
        is_active: true,
        technology: {
          contains: 'React',
          mode: 'insensitive',
        },
        month: {
          contains: 'January',
          mode: 'insensitive',
        },
        status: 'ACTIVE',
      });
    });

    it('should exclude is_active filter when include_inactive is true', () => {
      const where = buildWhereClause({ include_inactive: true });
      expect(where).toEqual({});
    });

    it('should combine filters with include_inactive', () => {
      const where = buildWhereClause({
        technology: 'React',
        include_inactive: true,
      });
      expect(where).toEqual({
        technology: {
          contains: 'React',
          mode: 'insensitive',
        },
      });
    });
  });
});
