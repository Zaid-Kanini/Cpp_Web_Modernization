import { Schedule } from '@prisma/client';
import { ScheduleRepository } from '../repositories/schedule.repository';
import { calculateBusinessDays } from '../utils/date.utils';
import { CreateScheduleInput, UpdateScheduleInput } from '../validators/schedule.validators';
import { ConflictError } from '../errors/ConflictError';
import { NotFoundError } from '../errors/NotFoundError';
import { PaginatedResponse } from '../types/pagination.types';
import { PaginationQuery } from '../validators/pagination.validators';
import { calculateSkip, buildPaginationMetadata } from '../utils/pagination.utils';
import { buildOrderBy } from '../utils/sorting.utils';
import { buildWhereClause } from '../utils/filtering.utils';

export class ScheduleService {
  constructor(private scheduleRepository: ScheduleRepository) {}

  async generateNextBatchId(): Promise<number> {
    const maxBatchId = await this.scheduleRepository.getMaxBatchId();
    
    if (maxBatchId === null) {
      return 1;
    }
    
    return maxBatchId + 1;
  }

  async validateBatchId(batchId: number): Promise<void> {
    const exists = await this.scheduleRepository.checkBatchIdExists(batchId);
    
    if (exists) {
      throw new Error('Batch ID already exists');
    }
  }

  async determineBatchId(providedBatchId?: number): Promise<number> {
    if (providedBatchId !== undefined) {
      await this.validateBatchId(providedBatchId);
      return providedBatchId;
    }
    
    return await this.generateNextBatchId();
  }

  async createSchedule(
    data: CreateScheduleInput,
    userId: string,
    correlationId: string
  ): Promise<Schedule> {
    const batchId = await this.determineBatchId(data.batch_id);
    
    const numberOfDays = calculateBusinessDays(data.start_date, data.end_date);
    
    const schedule = await this.scheduleRepository.create(
      {
        batch_id: batchId,
        technology: data.technology,
        start_date: data.start_date,
        end_date: data.end_date,
        number_of_days: numberOfDays,
        venue: data.venue,
        number_of_participants: data.number_of_participants,
        month: data.month || ['January','February','March','April','May','June','July','August','September','October','November','December'][new Date(data.start_date).getMonth()],
      },
      userId,
      correlationId
    );
    
    return schedule;
  }

  async getScheduleById(scheduleId: string): Promise<Schedule | null> {
    return await this.scheduleRepository.findById(scheduleId);
  }

  async getScheduleByBatchId(batchId: number): Promise<Schedule | null> {
    return await this.scheduleRepository.findByBatchId(batchId);
  }

  async getAllSchedules(filters?: {
    technology?: string;
    status?: string;
    month?: string;
  }): Promise<Schedule[]> {
    return await this.scheduleRepository.findAll(filters);
  }

  async updateSchedule(
    scheduleId: string,
    data: UpdateScheduleInput,
    userId: string,
    correlationId: string
  ): Promise<Schedule> {
    const { version, ...fieldsToUpdate } = data;
    
    const existingSchedule = await this.scheduleRepository.findById(scheduleId);
    
    if (!existingSchedule) {
      throw new NotFoundError('Schedule not found');
    }

    if (!existingSchedule.is_active) {
      throw new NotFoundError('Cannot update deleted schedule');
    }

    const beforeValue = {
      batch_id: existingSchedule.batch_id,
      technology: existingSchedule.technology,
      start_date: existingSchedule.start_date.toISOString(),
      end_date: existingSchedule.end_date.toISOString(),
      number_of_days: existingSchedule.number_of_days,
      venue: existingSchedule.venue,
      number_of_participants: existingSchedule.number_of_participants,
      month: existingSchedule.month,
      status: existingSchedule.status,
      version: existingSchedule.version,
    };

    const updates: any = {};
    
    if (fieldsToUpdate.technology !== undefined) {
      updates.technology = fieldsToUpdate.technology;
    }
    if (fieldsToUpdate.venue !== undefined) {
      updates.venue = fieldsToUpdate.venue;
    }
    if (fieldsToUpdate.month !== undefined) {
      updates.month = fieldsToUpdate.month;
    }
    if (fieldsToUpdate.number_of_participants !== undefined) {
      updates.number_of_participants = fieldsToUpdate.number_of_participants;
    }
    if (fieldsToUpdate.status !== undefined) {
      updates.status = fieldsToUpdate.status;
    }
    if (fieldsToUpdate.batch_id !== undefined) {
      updates.batch_id = fieldsToUpdate.batch_id;
    }

    const datesChanged = fieldsToUpdate.start_date !== undefined || fieldsToUpdate.end_date !== undefined;
    
    if (datesChanged) {
      const finalStartDate = fieldsToUpdate.start_date || existingSchedule.start_date.toISOString().split('T')[0];
      const finalEndDate = fieldsToUpdate.end_date || existingSchedule.end_date.toISOString().split('T')[0];
      
      updates.number_of_days = calculateBusinessDays(finalStartDate, finalEndDate);
      
      if (fieldsToUpdate.start_date !== undefined) {
        updates.start_date = fieldsToUpdate.start_date;
      }
      if (fieldsToUpdate.end_date !== undefined) {
        updates.end_date = fieldsToUpdate.end_date;
      }
    }

    const updatedSchedule = await this.scheduleRepository.updateWithVersionCheck(
      scheduleId,
      version,
      updates,
      userId,
      correlationId,
      beforeValue
    );

    if (updatedSchedule === null) {
      const latestVersion = await this.scheduleRepository.getScheduleVersion(scheduleId);
      
      if (latestVersion === null) {
        throw new NotFoundError('Schedule not found or has been deleted');
      }
      
      throw new ConflictError(
        'Version conflict: The schedule has been modified by another user',
        latestVersion
      );
    }

    return updatedSchedule;
  }

  async deleteSchedule(
    scheduleId: string,
    userId: string,
    correlationId: string
  ): Promise<void> {
    const deleted = await this.scheduleRepository.softDelete(scheduleId, userId, correlationId);
    
    if (!deleted) {
      throw new NotFoundError('Schedule not found or already deleted');
    }
  }

  async listSchedules(queryParams: PaginationQuery): Promise<PaginatedResponse<Schedule>> {
    const { page, limit, sort_by, order, ...filters } = queryParams;

    const where = buildWhereClause(filters);
    const orderBy = buildOrderBy(sort_by, order);
    const skip = calculateSkip(page, limit);

    const [schedules, total] = await Promise.all([
      this.scheduleRepository.findMany(where, orderBy, skip, limit),
      this.scheduleRepository.count(where),
    ]);

    const pagination = buildPaginationMetadata(total, page, limit);

    return {
      data: schedules,
      pagination,
    };
  }
}
