import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/rbac.middleware';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', requireAuth as any, requireAdmin as any, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({ success: false, message: 'Month is required (format: YYYY-MM)' });
    }

    const monthStr = month as string;

    // Parse YYYY-MM to get month name for DB field & date boundaries
    const [year, mon] = monthStr.split('-').map(Number);
    const monthStart = new Date(year, mon - 1, 1);
    const monthEnd = new Date(year, mon, 0); // last day of month
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = monthNames[mon - 1];

    // Fetch schedules that belong to this month (by month field OR date overlap)
    const schedules = await prisma.schedule.findMany({
      where: {
        is_active: true,
        OR: [
          { month: { contains: monthName, mode: 'insensitive' } },
          { month: monthStr },
          {
            start_date: { lte: monthEnd },
            end_date: { gte: monthStart },
          },
        ],
      },
      include: {
        trainer_allocations: {
          include: {
            faculty: { select: { user_id: true, first_name: true, last_name: true, email: true, technology_specializations: true } },
          },
        },
      },
      orderBy: { start_date: 'asc' },
    });

    // --- Schedule detail rows ---
    const reportData = schedules.map((s) => ({
      schedule_id: s.schedule_id,
      batch_id: s.batch_id,
      technology: s.technology,
      start_date: s.start_date,
      end_date: s.end_date,
      number_of_days: s.number_of_days,
      venue: s.venue,
      number_of_participants: s.number_of_participants,
      month: s.month,
      status: s.status,
      faculty: s.trainer_allocations.map((a) => ({
        name: `${a.faculty.first_name} ${a.faculty.last_name}`,
        email: a.faculty.email,
        allocation_status: a.allocation_status,
      })),
    }));

    // --- Summary ---
    const totalSchedules = reportData.length;
    const totalParticipants = reportData.reduce((sum, s) => sum + s.number_of_participants, 0);
    const totalTrainingDays = reportData.reduce((sum, s) => sum + s.number_of_days, 0);
    const avgParticipants = totalSchedules > 0 ? Math.round(totalParticipants / totalSchedules) : 0;

    // --- Status breakdown ---
    const statusBreakdown: Record<string, number> = {};
    reportData.forEach((s) => {
      statusBreakdown[s.status] = (statusBreakdown[s.status] || 0) + 1;
    });

    // --- Technology breakdown ---
    const techMap: Record<string, { count: number; participants: number; days: number }> = {};
    reportData.forEach((s) => {
      if (!techMap[s.technology]) techMap[s.technology] = { count: 0, participants: 0, days: 0 };
      techMap[s.technology].count += 1;
      techMap[s.technology].participants += s.number_of_participants;
      techMap[s.technology].days += s.number_of_days;
    });
    const technologyBreakdown = Object.entries(techMap)
      .map(([technology, data]) => ({ technology, ...data }))
      .sort((a, b) => b.count - a.count);

    // --- Venue breakdown ---
    const venueMap: Record<string, { count: number; participants: number }> = {};
    reportData.forEach((s) => {
      if (!venueMap[s.venue]) venueMap[s.venue] = { count: 0, participants: 0 };
      venueMap[s.venue].count += 1;
      venueMap[s.venue].participants += s.number_of_participants;
    });
    const venueBreakdown = Object.entries(venueMap)
      .map(([venue, data]) => ({ venue, ...data }))
      .sort((a, b) => b.count - a.count);

    // --- Faculty workload ---
    const facultyMap: Record<string, { name: string; email: string; schedulesAssigned: number; totalDays: number; totalParticipants: number; accepted: number; pending: number; cancelled: number }> = {};
    schedules.forEach((s) => {
      s.trainer_allocations.forEach((a) => {
        const fid = a.faculty.user_id;
        if (!facultyMap[fid]) {
          facultyMap[fid] = {
            name: `${a.faculty.first_name} ${a.faculty.last_name}`,
            email: a.faculty.email,
            schedulesAssigned: 0,
            totalDays: 0,
            totalParticipants: 0,
            accepted: 0,
            pending: 0,
            cancelled: 0,
          };
        }
        facultyMap[fid].schedulesAssigned += 1;
        facultyMap[fid].totalDays += s.number_of_days;
        facultyMap[fid].totalParticipants += s.number_of_participants;
        if (a.allocation_status === 'ACCEPTED') facultyMap[fid].accepted += 1;
        else if (a.allocation_status === 'PENDING') facultyMap[fid].pending += 1;
        else if (a.allocation_status === 'CANCELLED') facultyMap[fid].cancelled += 1;
      });
    });
    const facultyWorkload = Object.values(facultyMap).sort((a, b) => b.schedulesAssigned - a.schedulesAssigned);

    // --- Allocation stats ---
    const allAllocations = schedules.flatMap((s) => s.trainer_allocations);
    const totalAllocations = allAllocations.length;
    const acceptedAllocations = allAllocations.filter((a) => a.allocation_status === 'ACCEPTED').length;
    const pendingAllocations = allAllocations.filter((a) => a.allocation_status === 'PENDING').length;
    const cancelledAllocations = allAllocations.filter((a) => a.allocation_status === 'CANCELLED').length;
    const schedulesWithoutFaculty = reportData.filter((s) => s.faculty.length === 0).length;

    return res.status(200).json({
      success: true,
      month: monthStr,
      monthLabel: `${monthName} ${year}`,
      report: reportData,
      summary: {
        totalSchedules,
        totalParticipants,
        totalTrainingDays,
        avgParticipantsPerSchedule: avgParticipants,
        uniqueTechnologies: technologyBreakdown.length,
        uniqueVenues: venueBreakdown.length,
        uniqueFaculty: facultyWorkload.length,
        schedulesWithoutFaculty,
      },
      statusBreakdown,
      technologyBreakdown,
      venueBreakdown,
      facultyWorkload,
      allocationStats: {
        total: totalAllocations,
        accepted: acceptedAllocations,
        pending: pendingAllocations,
        cancelled: cancelledAllocations,
        acceptanceRate: totalAllocations > 0 ? Math.round((acceptedAllocations / totalAllocations) * 100) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
