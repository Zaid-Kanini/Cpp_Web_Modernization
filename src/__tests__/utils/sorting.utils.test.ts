import { buildOrderBy } from '../../utils/sorting.utils';

describe('Sorting Utils', () => {
  describe('buildOrderBy', () => {
    it('should build orderBy for technology ascending', () => {
      const orderBy = buildOrderBy('technology', 'asc');
      expect(orderBy).toEqual({ technology: 'asc' });
    });

    it('should build orderBy for start_date descending', () => {
      const orderBy = buildOrderBy('start_date', 'desc');
      expect(orderBy).toEqual({ start_date: 'desc' });
    });

    it('should build orderBy for end_date ascending', () => {
      const orderBy = buildOrderBy('end_date', 'asc');
      expect(orderBy).toEqual({ end_date: 'asc' });
    });

    it('should build orderBy for batch_id descending', () => {
      const orderBy = buildOrderBy('batch_id', 'desc');
      expect(orderBy).toEqual({ batch_id: 'desc' });
    });
  });
});
