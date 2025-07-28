import { applyCors, corsOptions } from "@/lib/cors";
import { prisma } from '@/lib/prisma';

export async function GET() {
  const [
    totalUsers,
    totalZones,
    totalParcels,
    totalAppointments,
    pendingAppointments,
    availableParcels,
    recentActivities
  ] = await Promise.all([
    prisma.user.count(),
    prisma.zone.count(),
    prisma.parcel.count(),
    prisma.appointment.count(),
    prisma.appointment.count({ where: { status: 'PENDING' } }),
    prisma.parcel.count({ where: { status: 'AVAILABLE' } }),
    prisma.activityLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } }
    })
  ]);

  return applyCors(
    Response.json({
      totalUsers,
      totalZones,
      totalParcels,
      totalAppointments,
      pendingAppointments,
      availableParcels,
      recentActivities
    })
  );
}

export function OPTIONS() {
  return corsOptions();
}
