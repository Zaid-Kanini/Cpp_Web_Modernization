import { PrismaClient, Role, ScheduleStatus, AllocationStatus, ActionType, EntityType } from '@prisma/client';

const prisma = new PrismaClient();

// Verify all models are available
const models = {
  user: prisma.user,
  schedule: prisma.schedule,
  trainerAllocation: prisma.trainerAllocation,
  auditLog: prisma.auditLog,
};

// Verify all enums are available
const enums = {
  role: Role.ADMIN,
  scheduleStatus: ScheduleStatus.ACTIVE,
  allocationStatus: AllocationStatus.PENDING,
  actionType: ActionType.CREATE,
  entityType: EntityType.USER,
};

console.log('✓ All Prisma Client types available:', Object.keys(models));
console.log('✓ All enums accessible:', Object.keys(enums));
console.log('✓ Prisma Client generated successfully');
