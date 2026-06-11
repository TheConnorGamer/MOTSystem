import { prisma } from "@/lib/prisma";

export const DEFAULT_REMINDER_DAYS = [30, 14, 7, 1] as const;

export type ReminderType =
  | "MOT"
  | "TAX"
  | "SERVICE"
  | "INSURANCE"
  | "WARRANTY"
  | "BREAKDOWN";

export function parseReminderDays(json?: string | null): number[] {
  try {
    const parsed = JSON.parse(json || JSON.stringify(DEFAULT_REMINDER_DAYS));
    if (!Array.isArray(parsed)) return [...DEFAULT_REMINDER_DAYS];
    return parsed.filter((n): n is number => typeof n === "number" && n > 0);
  } catch {
    return [...DEFAULT_REMINDER_DAYS];
  }
}

interface VehicleDates {
  motDueDate?: Date | null;
  taxDueDate?: Date | null;
  nextServiceDate?: Date | null;
  insuranceDueDate?: Date | null;
  warrantyExpiryDate?: Date | null;
  breakdownExpiryDate?: Date | null;
}

const DATE_FIELD_MAP: Record<ReminderType, keyof VehicleDates> = {
  MOT: "motDueDate",
  TAX: "taxDueDate",
  SERVICE: "nextServiceDate",
  INSURANCE: "insuranceDueDate",
  WARRANTY: "warrantyExpiryDate",
  BREAKDOWN: "breakdownExpiryDate",
};

export async function syncVehicleReminders(
  userId: string,
  vehicleId: string,
  vehicle: VehicleDates,
  reminderDays: number[] = [...DEFAULT_REMINDER_DAYS]
): Promise<void> {
  await prisma.reminder.deleteMany({
    where: {
      vehicleId,
      status: "PENDING",
      sentAt: null,
    },
  });

  for (const type of Object.keys(DATE_FIELD_MAP) as ReminderType[]) {
    const field = DATE_FIELD_MAP[type];
    const dueDate = vehicle[field];
    if (!dueDate) continue;

    for (const days of reminderDays) {
      const reminderDue = new Date(dueDate);
      reminderDue.setDate(reminderDue.getDate() - days);
      await prisma.reminder.create({
        data: {
          userId,
          vehicleId,
          type,
          dueDate: reminderDue,
          daysBefore: days,
        },
      });
    }
  }
}
