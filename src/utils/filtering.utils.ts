import { FilterParams } from '../types/pagination.types';

export function buildWhereClause(filters: FilterParams): any {
  const where: any = {};

  if (!filters.include_inactive) {
    where.is_active = true;
  }

  if (filters.technology) {
    where.technology = {
      contains: filters.technology,
      mode: 'insensitive',
    };
  }

  if (filters.month) {
    where.month = {
      contains: filters.month,
      mode: 'insensitive',
    };
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.date_from || filters.date_to) {
    if (filters.date_from) {
      where.start_date = {
        ...where.start_date,
        gte: new Date(filters.date_from),
      };
    }
    if (filters.date_to) {
      where.end_date = {
        ...where.end_date,
        lte: new Date(filters.date_to),
      };
    }
  }

  return where;
}
