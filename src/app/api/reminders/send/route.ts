import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendReminderEmail } from "@/lib/email";
import { sendSms } from "@/lib/sms";

/**
 * Check and send due reminders.
 * This can be called manually from the UI or via a cron job.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  // Only admin can trigger bulk sends, but users can send their own
  const isAdmin = session?.user?.role === "ADMIN";

  try {
    const body = await req.json().catch(() => ({}));
    const userId = isAdmin && body.userId ? body.userId : session?.user?.id;

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find reminders that are due (reminder.dueDate <= now) and not yet sent
    const dueReminders = await prisma.reminder.findMany({
      where: {
        userId,
        status: "PENDING",
        sentAt: null,
        dueDate: { lte: tomorrow },
      },
      include: { vehicle: true, user: true },
    });

    const results: Array<{ id: string; type: string; sent: boolean; method: string }> = [];

    for (const reminder of dueReminders) {
      if (!reminder.vehicle || !reminder.user) continue;

      const vehicle = reminder.vehicle;
      const user = reminder.user;

      let sent = false;
      let method = "none";

      // Calculate days remaining until actual due date
      let actualDueDate: Date | null = null;
      if (reminder.type === "MOT") actualDueDate = vehicle.motDueDate;
      else if (reminder.type === "TAX") actualDueDate = vehicle.taxDueDate;
      else if (reminder.type === "SERVICE") actualDueDate = vehicle.nextServiceDate;

      const daysRemaining = actualDueDate
        ? Math.ceil((actualDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // Send email if enabled
      if (user.emailRemindersEnabled && user.email) {
        try {
          await sendReminderEmail(
            user.email,
            reminder.type as "MOT" | "TAX" | "SERVICE",
            vehicle.registration,
            vehicle.make || "",
            vehicle.model || "",
            actualDueDate || new Date(),
            daysRemaining
          );
          sent = true;
          method = "email";
        } catch (e) {
          console.error("[REMINDER EMAIL] Failed:", e);
        }
      }

      // Send SMS if enabled and phone exists
      if (user.smsRemindersEnabled && user.phoneNumber && user.phoneVerified) {
        try {
          await sendSms(
            user.phoneNumber,
            `VehicleGuard: Your ${reminder.type} for ${vehicle.registration} is due in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}. Check your dashboard at ${process.env.APP_URL}/dashboard`
          );
          if (!sent) method = "sms";
          else method = "email+sms";
          sent = true;
        } catch (e) {
          console.error("[REMINDER SMS] Failed:", e);
        }
      }

      // Mark reminder as sent
      if (sent) {
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: "SENT", sentAt: new Date() },
        });

        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: "REMINDER_SENT",
            details: JSON.stringify({ type: reminder.type, vehicle: vehicle.registration, method }),
          },
        });
      } else {
        // Mark as failed if couldn't send
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: "FAILED" },
        });
      }

      results.push({ id: reminder.id, type: reminder.type, sent, method });
    }

    return NextResponse.json({
      checked: dueReminders.length,
      sent: results.filter((r) => r.sent).length,
      results,
    });
  } catch (error) {
    console.error("[REMINDERS SEND] Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dueCount = await prisma.reminder.count({
      where: {
        userId: session.user.id,
        status: "PENDING",
        sentAt: null,
        dueDate: { lte: tomorrow },
      },
    });

    return NextResponse.json({ dueCount });
  } catch (error) {
    console.error("[REMINDERS CHECK] Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
