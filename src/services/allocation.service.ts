import { AllocationRepository } from '../repositories/allocation.repository';
import { PrismaClient } from '@prisma/client';
import { AllocationResponse, AllocationResult, AllocationConflict } from '../types/allocation.types';
import { NotFoundError } from '../errors/NotFoundError';
import { sendAllocationNotification } from './email.service';
import { logger } from '../utils/logger';

export class AllocationService {
  constructor(
    private allocationRepository: AllocationRepository,
    private prisma: PrismaClient
  ) {}

  async allocateTrainer(
    facultyId: string,
    scheduleIds: string[],
    userId: string,
    correlationId: string
  ): Promise<AllocationResponse> {
    const faculty = await this.prisma.user.findUnique({
      where: { user_id: facultyId },
      select: {
        user_id: true,
        role: true,
        is_active: true,
        email: true,
        first_name: true,
        last_name: true,
      },
    });

    if (!faculty) {
      throw new NotFoundError('Faculty member not found');
    }

    if (!faculty.is_active) {
      throw new NotFoundError('Faculty member is inactive');
    }

    if (faculty.role !== 'FACULTY') {
      throw new Error('User must have FACULTY role to be allocated to schedules');
    }

    const schedules = await this.prisma.schedule.findMany({
      where: {
        schedule_id: { in: scheduleIds },
        is_active: true,
      },
      select: {
        schedule_id: true,
        batch_id: true,
        technology: true,
        start_date: true,
        end_date: true,
        venue: true,
        status: true,
      },
    });

    const foundScheduleIds = new Set(schedules.map((s) => s.schedule_id));
    const missingScheduleIds = scheduleIds.filter((id) => !foundScheduleIds.has(id));

    if (missingScheduleIds.length > 0) {
      throw new NotFoundError(
        `Schedules not found or inactive: ${missingScheduleIds.join(', ')}`
      );
    }

    const inactiveSchedules = schedules.filter((s) => s.status !== 'ACTIVE');
    if (inactiveSchedules.length > 0) {
      throw new Error(
        `Cannot allocate to non-active schedules: ${inactiveSchedules.map((s) => s.batch_id).join(', ')}`
      );
    }

    const successful: AllocationResult[] = [];
    const conflicts: AllocationConflict[] = [];

    for (const schedule of schedules) {
      const isDuplicate = await this.allocationRepository.checkDuplicate(
        facultyId,
        schedule.schedule_id
      );

      if (isDuplicate) {
        conflicts.push({
          schedule_id: schedule.schedule_id,
          reason: 'Faculty already allocated to this schedule',
        });
        continue;
      }

      const conflictCheck = await this.allocationRepository.checkConflict(
        facultyId,
        schedule.schedule_id
      );

      if (conflictCheck.hasConflict) {
        conflicts.push({
          schedule_id: schedule.schedule_id,
          reason: 'Schedule overlaps with existing allocation',
          conflicting_schedule: conflictCheck.conflictingSchedule,
        });
        continue;
      }

      successful.push({
        allocation_id: '',
        schedule_id: schedule.schedule_id,
        faculty_id: facultyId,
        allocation_status: 'PENDING' as any,
        allocation_date: new Date(),
        schedule_details: {
          batch_id: schedule.batch_id,
          technology: schedule.technology,
          start_date: schedule.start_date.toISOString(),
          end_date: schedule.end_date.toISOString(),
          venue: schedule.venue,
        },
      });
    }

    if (successful.length > 0) {
      const allocationsToCreate = successful.map((s) => ({
        schedule_id: s.schedule_id,
        faculty_id: facultyId,
        allocated_by: userId,
      }));

      const createdAllocations = await this.allocationRepository.createBatch(
        allocationsToCreate,
        correlationId
      );

      for (let i = 0; i < createdAllocations.length; i++) {
        successful[i].allocation_id = createdAllocations[i].allocation_id;
        successful[i].allocation_date = createdAllocations[i].allocation_date;
      }

      setImmediate(() => {
        sendAllocationNotification({
          email: faculty.email,
          firstName: faculty.first_name,
          lastName: faculty.last_name,
          schedules: successful.map((s) => s.schedule_details),
        }).catch((error) => {
          logger.error('Failed to send allocation notification email', {
            error: error instanceof Error ? error.message : 'Unknown error',
            facultyId,
            correlationId,
          });
        });
      });
    }

    return {
      successful,
      conflicts,
    };
  }
}
