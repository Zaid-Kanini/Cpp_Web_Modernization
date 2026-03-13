import { PrismaClient, Schedule } from '@prisma/client';

export class ScheduleRepository {
  constructor(private prisma: PrismaClient) {}

  async getMaxBatchId(): Promise<number | null> {
    const result = await this.prisma.schedule.aggregate({
      _max: {
        batch_id: true,
      },
    });

    return result._max.batch_id;
  }

  async checkBatchIdExists(batchId: number): Promise<boolean> {
    const schedule = await this.prisma.schedule.findFirst({
      where: {
        batch_id: batchId,
      },
    });

    return schedule !== null;
  }

  async create(
    data: {
      batch_id: number;
      technology: string;
      start_date: string;
      end_date: string;
      number_of_days: number;
      venue: string;
      number_of_participants: number;
      month: string;
    },
    userId: string,
    correlationId: string
  ): Promise<Schedule> {
    return await this.prisma.$transaction(async (tx) => {
      const schedule = await tx.schedule.create({
        data: {
          batch_id: data.batch_id,
          technology: data.technology,
          start_date: new Date(data.start_date),
          end_date: new Date(data.end_date),
          number_of_days: data.number_of_days,
          venue: data.venue,
          number_of_participants: data.number_of_participants,
          month: data.month,
          created_by: userId,
        },
      });

      await tx.auditLog.create({
        data: {
          action_type: 'CREATE',
          entity_type: 'SCHEDULE',
          entity_id: schedule.schedule_id,
          user_id: userId,
          correlation_id: correlationId,
          after_value: {
            batch_id: schedule.batch_id,
            technology: schedule.technology,
            start_date: schedule.start_date.toISOString(),
            end_date: schedule.end_date.toISOString(),
            number_of_days: schedule.number_of_days,
            venue: schedule.venue,
            number_of_participants: schedule.number_of_participants,
            month: schedule.month,
            status: schedule.status,
          },
        },
      });

      return schedule;
    });
  }

  async findById(scheduleId: string): Promise<Schedule | null> {
    return await this.prisma.schedule.findUnique({
      where: {
        schedule_id: scheduleId,
      },
    });
  }

  async findByBatchId(batchId: number): Promise<Schedule | null> {
    return await this.prisma.schedule.findUnique({
      where: {
        batch_id: batchId,
      },
    });
  }

  async findAll(filters?: {
    technology?: string;
    status?: string;
    month?: string;
  }): Promise<Schedule[]> {
    return await this.prisma.schedule.findMany({
      where: {
        ...(filters?.technology && { technology: filters.technology }),
        ...(filters?.status && { status: filters.status as any }),
        ...(filters?.month && { month: filters.month }),
        is_active: true,
      },
      orderBy: {
        start_date: 'desc',
      },
    });
  }

  async getScheduleVersion(scheduleId: string): Promise<number | null> {
    const schedule = await this.prisma.schedule.findUnique({
      where: { schedule_id: scheduleId },
      select: { version: true },
    });

    return schedule?.version ?? null;
  }

  async updateWithVersionCheck(
    scheduleId: string,
    version: number,
    data: {
      technology?: string;
      start_date?: string;
      end_date?: string;
      number_of_days?: number;
      venue?: string;
      number_of_participants?: number;
      month?: string;
      status?: string;
      batch_id?: number;
    },
    userId: string,
    correlationId: string,
    beforeValue: any
  ): Promise<Schedule | null> {
    return await this.prisma.$transaction(async (tx) => {
      try {
        const schedule = await tx.schedule.update({
          where: {
            schedule_id: scheduleId,
            version: version,
          },
          data: {
            ...(data.technology !== undefined && { technology: data.technology }),
            ...(data.start_date !== undefined && { start_date: new Date(data.start_date) }),
            ...(data.end_date !== undefined && { end_date: new Date(data.end_date) }),
            ...(data.number_of_days !== undefined && { number_of_days: data.number_of_days }),
            ...(data.venue !== undefined && { venue: data.venue }),
            ...(data.number_of_participants !== undefined && {
              number_of_participants: data.number_of_participants,
            }),
            ...(data.month !== undefined && { month: data.month }),
            ...(data.status !== undefined && { status: data.status as any }),
            ...(data.batch_id !== undefined && { batch_id: data.batch_id }),
            version: {
              increment: 1,
            },
          },
        });

        await tx.auditLog.create({
          data: {
            action_type: 'UPDATE',
            entity_type: 'SCHEDULE',
            entity_id: schedule.schedule_id,
            user_id: userId,
            correlation_id: correlationId,
            before_value: beforeValue,
            after_value: {
              batch_id: schedule.batch_id,
              technology: schedule.technology,
              start_date: schedule.start_date.toISOString(),
              end_date: schedule.end_date.toISOString(),
              number_of_days: schedule.number_of_days,
              venue: schedule.venue,
              number_of_participants: schedule.number_of_participants,
              month: schedule.month,
              status: schedule.status,
              version: schedule.version,
            },
          },
        });

        return schedule;
      } catch (error: any) {
        if (error.code === 'P2025') {
          return null;
        }
        throw error;
      }
    });
  }

  async update(
    scheduleId: string,
    data: {
      technology?: string;
      start_date?: string;
      end_date?: string;
      number_of_days?: number;
      venue?: string;
      number_of_participants?: number;
      month?: string;
      status?: string;
    },
    userId: string,
    correlationId: string,
    beforeValue: any
  ): Promise<Schedule> {
    return await this.prisma.$transaction(async (tx) => {
      const schedule = await tx.schedule.update({
        where: {
          schedule_id: scheduleId,
        },
        data: {
          ...(data.technology && { technology: data.technology }),
          ...(data.start_date && { start_date: new Date(data.start_date) }),
          ...(data.end_date && { end_date: new Date(data.end_date) }),
          ...(data.number_of_days !== undefined && { number_of_days: data.number_of_days }),
          ...(data.venue && { venue: data.venue }),
          ...(data.number_of_participants !== undefined && {
            number_of_participants: data.number_of_participants,
          }),
          ...(data.month && { month: data.month }),
          ...(data.status && { status: data.status as any }),
          version: {
            increment: 1,
          },
        },
      });

      await tx.auditLog.create({
        data: {
          action_type: 'UPDATE',
          entity_type: 'SCHEDULE',
          entity_id: schedule.schedule_id,
          user_id: userId,
          correlation_id: correlationId,
          before_value: beforeValue,
          after_value: {
            batch_id: schedule.batch_id,
            technology: schedule.technology,
            start_date: schedule.start_date.toISOString(),
            end_date: schedule.end_date.toISOString(),
            number_of_days: schedule.number_of_days,
            venue: schedule.venue,
            number_of_participants: schedule.number_of_participants,
            month: schedule.month,
            status: schedule.status,
          },
        },
      });

      return schedule;
    });
  }

  async softDelete(scheduleId: string, userId: string, correlationId: string): Promise<boolean> {
    return await this.prisma.$transaction(async (tx) => {
      const schedule = await tx.schedule.findUnique({
        where: {
          schedule_id: scheduleId,
          is_active: true,
        },
      });

      if (!schedule) {
        return false;
      }

      await tx.schedule.update({
        where: {
          schedule_id: scheduleId,
        },
        data: {
          is_active: false,
        },
      });

      await tx.auditLog.create({
        data: {
          action_type: 'DELETE',
          entity_type: 'SCHEDULE',
          entity_id: schedule.schedule_id,
          user_id: userId,
          correlation_id: correlationId,
          before_value: {
            batch_id: schedule.batch_id,
            technology: schedule.technology,
            start_date: schedule.start_date.toISOString(),
            end_date: schedule.end_date.toISOString(),
            number_of_days: schedule.number_of_days,
            venue: schedule.venue,
            number_of_participants: schedule.number_of_participants,
            month: schedule.month,
            status: schedule.status,
          },
        },
      });

      return true;
    });
  }

  async findMany(where: any, orderBy: any, skip: number, take: number): Promise<Schedule[]> {
    return await this.prisma.schedule.findMany({
      where,
      orderBy,
      skip,
      take,
    });
  }

  async count(where: any): Promise<number> {
    return await this.prisma.schedule.count({
      where,
    });
  }
}
