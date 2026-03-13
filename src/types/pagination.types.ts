export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMetadata {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

export type SortField = 'technology' | 'start_date' | 'end_date' | 'batch_id';

export type SortOrder = 'asc' | 'desc';

export interface SortParams {
  sort_by: SortField;
  order: SortOrder;
}

export type ScheduleStatus = 'ACTIVE' | 'CANCELLED' | 'COMPLETED';

export interface FilterParams {
  technology?: string;
  month?: string;
  date_from?: string;
  date_to?: string;
  status?: ScheduleStatus;
  include_inactive?: boolean;
}
