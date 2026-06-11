import { prisma } from "@/lib/prisma";
import { sendReminderEmail } from "@/lib/email";
import { sendSms } from "@/lib/sms";

export interface ReminderSendResult {
  id: string;
  type: string;
  sent: boolean;
  method: string;
}

export async function processDueReminders(
  userId?: string
): Promise<{ checked: number; sent: number; results: ReminderSendResult[] }> {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dueReminders = await prisma.reminder.findMany({
    where: {
      ...(userId ? { userId } : {}),
      status: "PENDING",
      sentAt: null,
      dueDate: { lte: tomorrow },
    },
    include: { vehicle: true, user: true },
  });

  const results: ReminderSendResult[] = [];

  for (const reminder of dueReminders) {
    if (!reminder.vehicle || !reminder.user) continue;

    const vehicle = reminder.vehicle;
    const user = reminder.user;

    let sent = false;
    let method = "none";

    let actualDueDate: Date | null = null;
    switch (reminder.type) {
      case "MOT":
        actualDueDate = vehicle.motDueDate;
        break;
      case "TAX":
        actualDueDate = vehicle.taxDueDate;
        break;
      case "SERVICE":
        actualDueDate = vehicle.nextServiceDate;
        break;
      case "INSURANCE":
        actualDueDate = vehicle.insuranceDueDate;
        break;
      case "WARRANTY":
        actualDueDate = vehicle.warrantyExpiryDate;
        break;
      case "BREAKDOWN":
        actualDueDate = vehicle.breakdownExpiryDate;
        break;
    }

    const daysRemaining = actualDueDate
      ? Math.ceil((actualDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : reminder.daysBefore;

    if (user.emailRemindersEnabled && user.email) {
      try {
        await sendReminderEmail(
          user.email,
          reminder.type as "MOT" | "TAX" | "SERVICE" | "INSURANCE" | "WARRANTY" | "BREAKDOWN",
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

    if (user.smsRemindersEnabled && user.phoneNumber && user.phoneVerified) {
      try {
        await sendSms(
          user.phoneNumber,
          `VehicleGuard: Your ${reminder.type} for ${vehicle.registration} is due in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}. ${process.env.APP_URL}/dashboard`
        );
        if (!sent) method = "sms";
        else method = "email+sms";
        sent = true;
      } catch (e) {
        console.error("[REMINDER SMS] Failed:", e);
      }
    }

    if (sent) {
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: "SENT", sentAt: new Date() },
      });

      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: "REMINDER_SENT",
          details: JSON.stringify({
            type: reminder.type,
            vehicle: vehicle.registration,
            method,
          }),
        },
      });
    } else {
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: "FAILED" },
      });
    }

    results.push({ id: reminder.id, type: reminder.type, sent, method });
  }

  return {
    checked: dueReminders.length,
    sent: results.filter((r) => r.sent).length,
    results,
  };
}
