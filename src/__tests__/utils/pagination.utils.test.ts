import { calculateSkip, calculateTotalPages, buildPaginationMetadata } from '../../utils/pagination.utils';

describe('Pagination Utils', () => {
  describe('calculateSkip', () => {
    it('should calculate skip for page 1 with limit 25', () => {
      expect(calculateSkip(1, 25)).toBe(0);
    });

    it('should calculate skip for page 2 with limit 25', () => {
      expect(calculateSkip(2, 25)).toBe(25);
    });

    it('should calculate skip for page 3 with limit 10', () => {
      expect(calculateSkip(3, 10)).toBe(20);
    });

    it('should calculate skip for page 5 with limit 50', () => {
      expect(calculateSkip(5, 50)).toBe(200);
    });
  });

  describe('calculateTotalPages', () => {
    it('should calculate total pages when total divides evenly', () => {
      expect(calculateTotalPages(100, 25)).toBe(4);
    });

    it('should calculate total pages when total does not divide evenly', () => {
      expect(calculateTotalPages(101, 25)).toBe(5);
    });

    it('should return 0 when total is 0', () => {
      expect(calculateTotalPages(0, 25)).toBe(0);
    });

    it('should return 1 when total equals limit', () => {
      expect(calculateTotalPages(25, 25)).toBe(1);
    });

    it('should return 1 when total is less than limit', () => {
      expect(calculateTotalPages(10, 25)).toBe(1);
    });
  });

  describe('buildPaginationMetadata', () => {
    it('should build correct metadata for first page', () => {
      const metadata = buildPaginationMetadata(100, 1, 25);
      expect(metadata).toEqual({
        total: 100,
        page: 1,
        limit: 25,
        total_pages: 4,
      });
    });

    it('should build correct metadata for middle page', () => {
      const metadata = buildPaginationMetadata(100, 2, 25);
      expect(metadata).toEqual({
        total: 100,
        page: 2,
        limit: 25,
        total_pages: 4,
      });
    });

    it('should build correct metadata when total does not divide evenly', () => {
      const metadata = buildPaginationMetadata(101, 1, 25);
      expect(metadata).toEqual({
        total: 101,
        page: 1,
        limit: 25,
        total_pages: 5,
      });
    });

    it('should build correct metadata for empty result set', () => {
      const metadata = buildPaginationMetadata(0, 1, 25);
      expect(metadata).toEqual({
        total: 0,
        page: 1,
        limit: 25,
        total_pages: 0,
      });
    });
  });
});
