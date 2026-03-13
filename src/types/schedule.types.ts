export interface CreateScheduleRequest {
  technology: string;
  start_date: string;
  end_date: string;
  venue: string;
  number_of_participants: number;
  month: string;
  batch_id?: number;
}

export interface CreateScheduleResponse {
  schedule_id: string;
  batch_id: number;
  technology: string;
  start_date: string;
  end_date: string;
  venue: string;
  number_of_participants: number;
  month: string;
  number_of_days: number;
  status: string;
  created_at: Date;
}

export interface UpdateScheduleRequest {
  version: number;
  technology?: string;
  start_date?: string;
  end_date?: string;
  venue?: string;
  number_of_participants?: number;
  month?: string;
  status?: string;
  batch_id?: number;
}

export interface UpdateScheduleResponse {
  schedule_id: string;
  batch_id: number;
  technology: string;
  start_date: string;
  end_date: string;
  venue: string;
  number_of_participants: number;
  month: string;
  number_of_days: number;
  status: string;
  version: number;
  created_at: Date;
  updated_at: Date;
}

export interface ScheduleListItem {
  schedule_id: string;
  batch_id: number;
  technology: string;
  start_date: string;
  end_date: string;
  venue: string;
  number_of_participants: number;
  month: string;
  number_of_days: number;
  status: string;
  created_at: Date;
}
