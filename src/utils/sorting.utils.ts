import { SortField, SortOrder } from '../types/pagination.types';

export function buildOrderBy(sortBy: SortField, order: SortOrder): object {
  return {
    [sortBy]: order,
  };
}
