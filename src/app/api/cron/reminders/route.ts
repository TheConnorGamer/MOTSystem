import { NextRequest, NextResponse } from "next/server";
import { processDueReminders } from "@/lib/reminders";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = req.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

/**
 * Vercel Cron hits this daily to send MOT/tax/service reminders for all users.
 * Set CRON_SECRET in Vercel env — Vercel sends it as Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[CRON] Processing due reminders for all users");
    const result = await processDueReminders();
    console.log(`[CRON] Checked ${result.checked}, sent ${result.sent}`);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[CRON] Reminder job failed:", error);
    return NextResponse.json({ message: "Cron job failed" }, { status: 500 });
  }
}
