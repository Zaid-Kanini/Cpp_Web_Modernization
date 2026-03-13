export enum AllocationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  CANCELLED = 'CANCELLED',
}

export interface CreateAllocationRequest {
  faculty_id: string;
  schedule_ids: string[];
}

export interface AllocationResult {
  allocation_id: string;
  schedule_id: string;
  faculty_id: string;
  allocation_status: AllocationStatus;
  allocation_date: Date;
  schedule_details: {
    batch_id: number;
    technology: string;
    start_date: string;
    end_date: string;
    venue: string;
  };
}

export interface AllocationConflict {
  schedule_id: string;
  reason: string;
  conflicting_schedule?: {
    batch_id: number;
    technology: string;
    start_date: string;
    end_date: string;
  };
}

export interface AllocationResponse {
  successful: AllocationResult[];
  conflicts: AllocationConflict[];
}
