import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

// Use string literals for enum values instead of importing enums
const Role = {
  ADMIN: 'ADMIN' as const,
  FACULTY: 'FACULTY' as const,
};

const ScheduleStatus = {
  ACTIVE: 'ACTIVE' as const,
  CANCELLED: 'CANCELLED' as const,
  COMPLETED: 'COMPLETED' as const,
};

const AllocationStatus = {
  PENDING: 'PENDING' as const,
  ACCEPTED: 'ACCEPTED' as const,
  CANCELLED: 'CANCELLED' as const,
};

const ActionType = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS' as const,
  LOGIN_FAILURE: 'LOGIN_FAILURE' as const,
  LOGOUT: 'LOGOUT' as const,
  CREATE: 'CREATE' as const,
  UPDATE: 'UPDATE' as const,
  DELETE: 'DELETE' as const,
  ACCEPT: 'ACCEPT' as const,
  CANCEL: 'CANCEL' as const,
};

const EntityType = {
  USER: 'USER' as const,
  SCHEDULE: 'SCHEDULE' as const,
  ALLOCATION: 'ALLOCATION' as const,
};

// Helper function to hash passwords
async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    timeCost: 3,
    memoryCost: 65536,
    parallelism: 1,
  });
}

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (in reverse order of dependencies)
  console.log('🧹 Cleaning existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.trainerAllocation.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.user.deleteMany();

  // Hash passwords for all users (using "Password123!" as default)
  console.log('🔐 Hashing passwords...');
  const defaultPassword = await hashPassword('Password123!');

  // Create Admin Users
  console.log('👤 Creating admin users...');
  const admin1 = await prisma.user.create({
    data: {
      email: 'admin@trainingcenter.com',
      password_hash: defaultPassword,
      role: Role.ADMIN,
      first_name: 'John',
      last_name: 'Administrator',
      technology_specializations: ['Management', 'Operations'],
      is_active: true,
      force_password_change: false,
      failed_login_attempts: 0,
    },
  });

  const admin2 = await prisma.user.create({
    data: {
      email: 'sarah.manager@trainingcenter.com',
      password_hash: defaultPassword,
      role: Role.ADMIN,
      first_name: 'Sarah',
      last_name: 'Manager',
      technology_specializations: ['Planning', 'Coordination'],
      is_active: true,
      force_password_change: false,
      failed_login_attempts: 0,
    },
  });

  // Create Faculty Users
  console.log('👨‍🏫 Creating faculty users...');
  const faculty1 = await prisma.user.create({
    data: {
      email: 'robert.smith@trainingcenter.com',
      password_hash: defaultPassword,
      role: Role.FACULTY,
      first_name: 'Robert',
      last_name: 'Smith',
      technology_specializations: ['React', 'JavaScript', 'TypeScript', 'Node.js'],
      is_active: true,
      force_password_change: false,
      failed_login_attempts: 0,
    },
  });

  const faculty2 = await prisma.user.create({
    data: {
      email: 'emily.johnson@trainingcenter.com',
      password_hash: defaultPassword,
      role: Role.FACULTY,
      first_name: 'Emily',
      last_name: 'Johnson',
      technology_specializations: ['Python', 'Django', 'FastAPI', 'Machine Learning'],
      is_active: true,
      force_password_change: false,
      failed_login_attempts: 0,
    },
  });

  const faculty3 = await prisma.user.create({
    data: {
      email: 'michael.chen@trainingcenter.com',
      password_hash: defaultPassword,
      role: Role.FACULTY,
      first_name: 'Michael',
      last_name: 'Chen',
      technology_specializations: ['Java', 'Spring Boot', 'Microservices', 'Kubernetes'],
      is_active: true,
      force_password_change: false,
      failed_login_attempts: 0,
    },
  });

  const faculty4 = await prisma.user.create({
    data: {
      email: 'lisa.williams@trainingcenter.com',
      password_hash: defaultPassword,
      role: Role.FACULTY,
      first_name: 'Lisa',
      last_name: 'Williams',
      technology_specializations: ['React', 'Vue.js', 'Angular', 'CSS', 'UI/UX'],
      is_active: true,
      force_password_change: false,
      failed_login_attempts: 0,
    },
  });

  const faculty5 = await prisma.user.create({
    data: {
      email: 'david.brown@trainingcenter.com',
      password_hash: defaultPassword,
      role: Role.FACULTY,
      first_name: 'David',
      last_name: 'Brown',
      technology_specializations: ['AWS', 'Azure', 'DevOps', 'Docker', 'CI/CD'],
      is_active: true,
      force_password_change: false,
      failed_login_attempts: 0,
    },
  });

  // Create Training Schedules
  console.log('📅 Creating training schedules...');
  const schedule1 = await prisma.schedule.create({
    data: {
      batch_id: 1001,
      technology: 'React Advanced',
      start_date: new Date('2026-03-15'),
      end_date: new Date('2026-03-26'),
      number_of_days: 10,
      venue: 'Training Center - Room A',
      number_of_participants: 25,
      month: 'March 2026',
      status: ScheduleStatus.ACTIVE,
      version: 1,
      is_active: true,
      created_by: admin1.user_id,
    },
  });

  const schedule2 = await prisma.schedule.create({
    data: {
      batch_id: 1002,
      technology: 'Python & Django',
      start_date: new Date('2026-03-20'),
      end_date: new Date('2026-04-02'),
      number_of_days: 12,
      venue: 'Training Center - Room B',
      number_of_participants: 30,
      month: 'March 2026',
      status: ScheduleStatus.ACTIVE,
      version: 1,
      is_active: true,
      created_by: admin1.user_id,
    },
  });

  const schedule3 = await prisma.schedule.create({
    data: {
      batch_id: 1003,
      technology: 'Java Spring Boot',
      start_date: new Date('2026-04-05'),
      end_date: new Date('2026-04-18'),
      number_of_days: 12,
      venue: 'Training Center - Room C',
      number_of_participants: 20,
      month: 'April 2026',
      status: ScheduleStatus.ACTIVE,
      version: 1,
      is_active: true,
      created_by: admin2.user_id,
    },
  });

  const schedule4 = await prisma.schedule.create({
    data: {
      batch_id: 1004,
      technology: 'AWS Cloud Fundamentals',
      start_date: new Date('2026-04-10'),
      end_date: new Date('2026-04-21'),
      number_of_days: 10,
      venue: 'Online - Zoom',
      number_of_participants: 40,
      month: 'April 2026',
      status: ScheduleStatus.ACTIVE,
      version: 1,
      is_active: true,
      created_by: admin2.user_id,
    },
  });

  const schedule5 = await prisma.schedule.create({
    data: {
      batch_id: 1005,
      technology: 'Node.js Backend Development',
      start_date: new Date('2026-02-15'),
      end_date: new Date('2026-02-28'),
      number_of_days: 12,
      venue: 'Training Center - Room A',
      number_of_participants: 22,
      month: 'February 2026',
      status: ScheduleStatus.COMPLETED,
      version: 1,
      is_active: true,
      created_by: admin1.user_id,
    },
  });

  // Create Trainer Allocations
  console.log('🎯 Creating trainer allocations...');
  const allocation1 = await prisma.trainerAllocation.create({
    data: {
      schedule_id: schedule1.schedule_id,
      faculty_id: faculty1.user_id,
      allocated_by: admin1.user_id,
      allocation_status: AllocationStatus.ACCEPTED,
      allocation_date: new Date('2026-03-01'),
      response_date: new Date('2026-03-02'),
    },
  });

  await prisma.trainerAllocation.create({
    data: {
      schedule_id: schedule1.schedule_id,
      faculty_id: faculty4.user_id,
      allocated_by: admin1.user_id,
      allocation_status: AllocationStatus.ACCEPTED,
      allocation_date: new Date('2026-03-01'),
      response_date: new Date('2026-03-03'),
    },
  });

  await prisma.trainerAllocation.create({
    data: {
      schedule_id: schedule2.schedule_id,
      faculty_id: faculty2.user_id,
      allocated_by: admin1.user_id,
      allocation_status: AllocationStatus.ACCEPTED,
      allocation_date: new Date('2026-03-05'),
      response_date: new Date('2026-03-06'),
    },
  });

  await prisma.trainerAllocation.create({
    data: {
      schedule_id: schedule3.schedule_id,
      faculty_id: faculty3.user_id,
      allocated_by: admin2.user_id,
      allocation_status: AllocationStatus.PENDING,
      allocation_date: new Date('2026-03-10'),
    },
  });

  await prisma.trainerAllocation.create({
    data: {
      schedule_id: schedule4.schedule_id,
      faculty_id: faculty5.user_id,
      allocated_by: admin2.user_id,
      allocation_status: AllocationStatus.ACCEPTED,
      allocation_date: new Date('2026-03-08'),
      response_date: new Date('2026-03-09'),
    },
  });

  await prisma.trainerAllocation.create({
    data: {
      schedule_id: schedule5.schedule_id,
      faculty_id: faculty1.user_id,
      allocated_by: admin1.user_id,
      allocation_status: AllocationStatus.ACCEPTED,
      allocation_date: new Date('2026-02-01'),
      response_date: new Date('2026-02-02'),
    },
  });

  // Create Audit Logs
  console.log('📝 Creating audit logs...');
  await prisma.auditLog.create({
    data: {
      timestamp: new Date('2026-03-01T09:00:00Z'),
      user_id: admin1.user_id,
      action_type: ActionType.LOGIN_SUCCESS,
      entity_type: EntityType.USER,
      entity_id: admin1.user_id,
      after_value: { email: admin1.email, role: admin1.role },
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      correlation_id: '550e8400-e29b-41d4-a716-446655440001',
    },
  });

  await prisma.auditLog.create({
    data: {
      timestamp: new Date('2026-03-01T09:15:00Z'),
      user_id: admin1.user_id,
      action_type: ActionType.CREATE,
      entity_type: EntityType.SCHEDULE,
      entity_id: schedule1.schedule_id,
      after_value: {
        batch_id: schedule1.batch_id,
        technology: schedule1.technology,
        start_date: schedule1.start_date,
        end_date: schedule1.end_date,
      },
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      correlation_id: '550e8400-e29b-41d4-a716-446655440002',
    },
  });

  await prisma.auditLog.create({
    data: {
      timestamp: new Date('2026-03-01T09:30:00Z'),
      user_id: admin1.user_id,
      action_type: ActionType.CREATE,
      entity_type: EntityType.ALLOCATION,
      entity_id: allocation1.allocation_id,
      after_value: {
        schedule_id: allocation1.schedule_id,
        faculty_id: allocation1.faculty_id,
        allocation_status: allocation1.allocation_status,
      },
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      correlation_id: '550e8400-e29b-41d4-a716-446655440003',
    },
  });

  await prisma.auditLog.create({
    data: {
      timestamp: new Date('2026-03-02T10:00:00Z'),
      user_id: faculty1.user_id,
      action_type: ActionType.ACCEPT,
      entity_type: EntityType.ALLOCATION,
      entity_id: allocation1.allocation_id,
      before_value: { allocation_status: 'PENDING' },
      after_value: { allocation_status: 'ACCEPTED' },
      ip_address: '192.168.1.105',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      correlation_id: '550e8400-e29b-41d4-a716-446655440004',
    },
  });

  await prisma.auditLog.create({
    data: {
      timestamp: new Date('2026-03-05T14:20:00Z'),
      user_id: admin2.user_id,
      action_type: ActionType.LOGIN_SUCCESS,
      entity_type: EntityType.USER,
      entity_id: admin2.user_id,
      after_value: { email: admin2.email, role: admin2.role },
      ip_address: '192.168.1.110',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      correlation_id: '550e8400-e29b-41d4-a716-446655440005',
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Users: ${await prisma.user.count()} (2 Admins, 5 Faculty)`);
  console.log(`   - Schedules: ${await prisma.schedule.count()}`);
  console.log(`   - Trainer Allocations: ${await prisma.trainerAllocation.count()}`);
  console.log(`   - Audit Logs: ${await prisma.auditLog.count()}`);
  console.log('\n🔑 Test Login Credentials:');
  console.log('   All users have password: Password123!');
  console.log('\n   Admin Users:');
  console.log('   - admin@trainingcenter.com');
  console.log('   - sarah.manager@trainingcenter.com');
  console.log('\n   Faculty Users:');
  console.log('   - robert.smith@trainingcenter.com');
  console.log('   - emily.johnson@trainingcenter.com');
  console.log('   - michael.chen@trainingcenter.com');
  console.log('   - lisa.williams@trainingcenter.com');
  console.log('   - david.brown@trainingcenter.com');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
