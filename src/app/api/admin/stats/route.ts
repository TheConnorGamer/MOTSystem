import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const [
      totalUsers,
      totalVehicles,
      totalReminders,
      totalActivities,
      recentActivities,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.vehicle.count(),
      prisma.reminder.count(),
      prisma.activityLog.count(),
      prisma.activityLog.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { email: true } },
        },
      }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalVehicles,
      totalReminders,
      totalActivities,
      recentActivities,
    });
  } catch (error) {
    console.error("[ADMIN STATS] Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
