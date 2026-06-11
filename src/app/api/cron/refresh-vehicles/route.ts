import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enrichVehicleFromDvsa } from "@/lib/vehicle-enrich";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * Weekly DVSA refresh for all garage vehicles (free MOT API only).
 */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const vehicles = await prisma.vehicle.findMany({
    select: { id: true, userId: true, registration: true },
  });

  let refreshed = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const v of vehicles) {
    try {
      await enrichVehicleFromDvsa(v.id, v.userId);
      refreshed++;
      // Gentle pacing for DVSA rate limits
      await new Promise((r) => setTimeout(r, 300));
    } catch (e) {
      failed++;
      errors.push(`${v.registration}: ${e instanceof Error ? e.message : "error"}`);
    }
  }

  console.log(`[CRON REFRESH] ${refreshed} ok, ${failed} failed of ${vehicles.length}`);

  return NextResponse.json({
    ok: true,
    total: vehicles.length,
    refreshed,
    failed,
    errors: errors.slice(0, 10),
  });
}
