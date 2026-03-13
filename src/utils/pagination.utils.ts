import { PaginationMetadata } from '../types/pagination.types';

export function calculateSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}

export function calculateTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit);
}

export function buildPaginationMetadata(
  total: number,
  page: number,
  limit: number
): PaginationMetadata {
  const total_pages = calculateTotalPages(total, limit);
  
  return {
    total,
    page,
    limit,
    total_pages,
  };
}
