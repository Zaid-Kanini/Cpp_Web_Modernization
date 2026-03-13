import { PrismaClient, Schedule } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedSchedules(count: number): Promise<Schedule[]> {
  const technologies = ['React', 'Angular', 'Vue', 'Node.js', 'Python', 'Java'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const statuses = ['ACTIVE', 'CANCELLED', 'COMPLETED'] as const;
  const venues = ['Room A', 'Room B', 'Room C', 'Online'];

  const schedules: Schedule[] = [];
  const currentYear = new Date().getFullYear();

  for (let i = 0; i < count; i++) {
    const techIndex = i % technologies.length;
    const monthIndex = i % months.length;
    const statusIndex = i % statuses.length;
    const venueIndex = i % venues.length;

    const startDay = 1 + (i % 28);
    const monthNum = monthIndex + 1;
    const startDate = new Date(currentYear, monthNum - 1, startDay);
    const endDate = new Date(currentYear, monthNum - 1, startDay + 5);

    const isActive = i % 10 !== 0;

    const schedule = await prisma.schedule.create({
      data: {
        batch_id: 1000 + i,
        technology: technologies[techIndex],
        start_date: startDate,
        end_date: endDate,
        number_of_days: 5,
        venue: venues[venueIndex],
        number_of_participants: 10 + (i % 20),
        month: months[monthIndex],
        status: statuses[statusIndex],
        is_active: isActive,
        created_by: 'test-user-id',
      },
    });

    schedules.push(schedule);
  }

  return schedules;
}

export async function clearSchedules(): Promise<void> {
  await prisma.schedule.deleteMany({});
}
