import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function setupTestDatabase(): Promise<PrismaClient> {
  return prisma;
}

export async function teardownTestDatabase(): Promise<void> {
  await prisma.$disconnect();
}

export async function clearDatabase(): Promise<void> {
  await prisma.auditLog.deleteMany({});
  await prisma.trainerAllocation.deleteMany({});
  await prisma.schedule.deleteMany({});
  await prisma.user.deleteMany({});
}

export async function createTestUser(
  email: string,
  role: 'ADMIN' | 'FACULTY',
  password: string = 'Test@123'
): Promise<any> {
  const argon2 = require('argon2');
  const passwordHash = await argon2.hash(password);

  return await prisma.user.create({
    data: {
      email,
      password_hash: passwordHash,
      role,
      first_name: role === 'ADMIN' ? 'Admin' : 'Faculty',
      last_name: 'User',
      technology_specializations: role === 'FACULTY' ? ['React', 'Node.js'] : [],
    },
  });
}

export { prisma };
