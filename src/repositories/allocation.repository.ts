import { PrismaClient, TrainerAllocation } from '@prisma/client';

export class AllocationRepository {
  constructor(private prisma: PrismaClient) {}

  async checkConflict(
    facultyId: string,
    scheduleId: string
  ): Promise<{ hasConflict: boolean; conflictingSchedule?: any }> {
    const targetSchedule = await this.prisma.schedule.findUnique({
      where: { schedule_id: scheduleId },
      select: {
        start_date: true,
        end_date: true,
        batch_id: true,
        technology: true,
      },
    });

    if (!targetSchedule) {
      return { hasConflict: false };
    }

    const conflictingAllocation = await this.prisma.trainerAllocation.findFirst({
      where: {
        faculty_id: facultyId,
        allocation_status: {
          in: ['PENDING', 'ACCEPTED'],
        },
        schedule: {
          start_date: {
            lte: targetSchedule.end_date,
          },
          end_date: {
            gte: targetSchedule.start_date,
          },
          is_active: true,
        },
      },
      include: {
        schedule: {
          select: {
            batch_id: true,
            technology: true,
            start_date: true,
            end_date: true,
          },
        },
      },
    });

    if (conflictingAllocation) {
      return {
        hasConflict: true,
        conflictingSchedule: {
          batch_id: conflictingAllocation.schedule.batch_id,
          technology: conflictingAllocation.schedule.technology,
          start_date: conflictingAllocation.schedule.start_date.toISOString(),
          end_date: conflictingAllocation.schedule.end_date.toISOString(),
        },
      };
    }

    return { hasConflict: false };
  }

  async checkDuplicate(facultyId: string, scheduleId: string): Promise<boolean> {
    const existing = await this.prisma.trainerAllocation.findUnique({
      where: {
        schedule_id_faculty_id: {
          schedule_id: scheduleId,
          faculty_id: facultyId,
        },
      },
    });

    return existing !== null;
  }

  async create(
    data: {
      schedule_id: string;
      faculty_id: string;
      allocated_by: string;
    },
    correlationId: string
  ): Promise<TrainerAllocation> {
    return await this.prisma.$transaction(async (tx) => {
      const allocation = await tx.trainerAllocation.create({
        data: {
          schedule_id: data.schedule_id,
          faculty_id: data.faculty_id,
          allocated_by: data.allocated_by,
          allocation_status: 'PENDING',
        },
      });

      await tx.auditLog.create({
        data: {
          action_type: 'CREATE',
          entity_type: 'ALLOCATION',
          entity_id: allocation.allocation_id,
          user_id: data.allocated_by,
          correlation_id: correlationId,
          after_value: {
            allocation_id: allocation.allocation_id,
            schedule_id: allocation.schedule_id,
            faculty_id: allocation.faculty_id,
            allocation_status: allocation.allocation_status,
            allocation_date: allocation.allocation_date.toISOString(),
          },
        },
      });

      return allocation;
    });
  }

  async createBatch(
    allocations: Array<{
      schedule_id: string;
      faculty_id: string;
      allocated_by: string;
    }>,
    correlationId: string
  ): Promise<TrainerAllocation[]> {
    return await this.prisma.$transaction(async (tx) => {
      const createdAllocations: TrainerAllocation[] = [];

      for (const data of allocations) {
        const allocation = await tx.trainerAllocation.create({
          data: {
            schedule_id: data.schedule_id,
            faculty_id: data.faculty_id,
            allocated_by: data.allocated_by,
            allocation_status: 'PENDING',
          },
        });

        await tx.auditLog.create({
          data: {
            action_type: 'CREATE',
            entity_type: 'ALLOCATION',
            entity_id: allocation.allocation_id,
            user_id: data.allocated_by,
            correlation_id: correlationId,
            after_value: {
              allocation_id: allocation.allocation_id,
              schedule_id: allocation.schedule_id,
              faculty_id: allocation.faculty_id,
              allocation_status: allocation.allocation_status,
              allocation_date: allocation.allocation_date.toISOString(),
            },
          },
        });

        createdAllocations.push(allocation);
      }

      return createdAllocations;
    });
  }

  async findById(allocationId: string): Promise<TrainerAllocation | null> {
    return await this.prisma.trainerAllocation.findUnique({
      where: {
        allocation_id: allocationId,
      },
    });
  }

  async findByScheduleAndFaculty(
    scheduleId: string,
    facultyId: string
  ): Promise<TrainerAllocation | null> {
    return await this.prisma.trainerAllocation.findUnique({
      where: {
        schedule_id_faculty_id: {
          schedule_id: scheduleId,
          faculty_id: facultyId,
        },
      },
    });
  }
}
