import { Request, Response, NextFunction } from 'express';
import { ScheduleService } from '../services/schedule.service';
import { v4 as uuidv4, validate } from 'uuid';
import { NotFoundError } from '../errors/NotFoundError';

export class ScheduleController {
  constructor(private scheduleService: ScheduleService) {}

  createSchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.user_id;
      
      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      const correlationId = uuidv4();
      
      const schedule = await this.scheduleService.createSchedule(
        req.body,
        userId,
        correlationId
      );

      return res.status(201).json({
        schedule: {
          schedule_id: schedule.schedule_id,
          batch_id: schedule.batch_id,
          technology: schedule.technology,
          start_date: schedule.start_date.toISOString(),
          end_date: schedule.end_date.toISOString(),
          venue: schedule.venue,
          number_of_participants: schedule.number_of_participants,
          month: schedule.month,
          number_of_days: schedule.number_of_days,
          status: schedule.status,
          created_at: schedule.created_at,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Batch ID already exists') {
        return res.status(400).json({
          error: 'Validation failed',
          message: error.message,
        });
      }
      
      next(error);
    }
  };

  getScheduleById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { scheduleId } = req.params;
      
      const schedule = await this.scheduleService.getScheduleById(scheduleId);
      
      if (!schedule) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Schedule not found',
        });
      }

      if (!schedule.is_active) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Schedule has been deleted',
        });
      }

      return res.status(200).json({
        schedule: {
          schedule_id: schedule.schedule_id,
          batch_id: schedule.batch_id,
          technology: schedule.technology,
          start_date: schedule.start_date.toISOString(),
          end_date: schedule.end_date.toISOString(),
          venue: schedule.venue,
          number_of_participants: schedule.number_of_participants,
          month: schedule.month,
          number_of_days: schedule.number_of_days,
          status: schedule.status,
          created_at: schedule.created_at,
          updated_at: schedule.updated_at,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getScheduleByBatchId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const batchId = parseInt(req.params.batchId, 10);
      
      if (isNaN(batchId)) {
        return res.status(400).json({
          error: 'Invalid parameter',
          message: 'Batch ID must be a number',
        });
      }
      
      const schedule = await this.scheduleService.getScheduleByBatchId(batchId);
      
      if (!schedule) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Schedule not found',
        });
      }

      if (!schedule.is_active) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Schedule has been deleted',
        });
      }

      return res.status(200).json({
        schedule: {
          schedule_id: schedule.schedule_id,
          batch_id: schedule.batch_id,
          technology: schedule.technology,
          start_date: schedule.start_date.toISOString(),
          end_date: schedule.end_date.toISOString(),
          venue: schedule.venue,
          number_of_participants: schedule.number_of_participants,
          month: schedule.month,
          number_of_days: schedule.number_of_days,
          status: schedule.status,
          created_at: schedule.created_at,
          updated_at: schedule.updated_at,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getAllSchedules = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { technology, status, month } = req.query;
      
      const filters = {
        ...(technology && { technology: technology as string }),
        ...(status && { status: status as string }),
        ...(month && { month: month as string }),
      };
      
      const schedules = await this.scheduleService.getAllSchedules(filters);
      
      return res.status(200).json({
        schedules: schedules.map((schedule) => ({
          schedule_id: schedule.schedule_id,
          batch_id: schedule.batch_id,
          technology: schedule.technology,
          start_date: schedule.start_date.toISOString(),
          end_date: schedule.end_date.toISOString(),
          venue: schedule.venue,
          number_of_participants: schedule.number_of_participants,
          month: schedule.month,
          number_of_days: schedule.number_of_days,
          status: schedule.status,
          created_at: schedule.created_at,
        })),
        count: schedules.length,
      });
    } catch (error) {
      next(error);
    }
  };

  updateSchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { scheduleId } = req.params;
      const userId = req.user?.user_id;
      
      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      const correlationId = uuidv4();
      
      const schedule = await this.scheduleService.updateSchedule(
        scheduleId,
        req.body,
        userId,
        correlationId
      );

      return res.status(200).json({
        schedule: {
          schedule_id: schedule.schedule_id,
          batch_id: schedule.batch_id,
          technology: schedule.technology,
          start_date: schedule.start_date.toISOString(),
          end_date: schedule.end_date.toISOString(),
          venue: schedule.venue,
          number_of_participants: schedule.number_of_participants,
          month: schedule.month,
          number_of_days: schedule.number_of_days,
          status: schedule.status,
          version: schedule.version,
          created_at: schedule.created_at,
          updated_at: schedule.updated_at,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  deleteSchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { scheduleId } = req.params;
      
      if (!validate(scheduleId)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid schedule ID format',
        });
      }
      
      const userId = req.user?.user_id;
      
      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      const correlationId = uuidv4();
      
      await this.scheduleService.deleteSchedule(scheduleId, userId, correlationId);

      return res.status(204).send();
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({
          error: 'Not found',
          message: error.message,
        });
      }
      
      next(error);
    }
  };

  listSchedules = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.scheduleService.listSchedules(req.query as any);

      return res.status(200).json({
        schedules: result.data.map((schedule) => ({
          schedule_id: schedule.schedule_id,
          batch_id: schedule.batch_id,
          technology: schedule.technology,
          start_date: schedule.start_date.toISOString(),
          end_date: schedule.end_date.toISOString(),
          venue: schedule.venue,
          number_of_participants: schedule.number_of_participants,
          month: schedule.month,
          number_of_days: schedule.number_of_days,
          status: schedule.status,
          created_at: schedule.created_at,
        })),
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };
}
