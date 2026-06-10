/**
 * BullMQ Queue Configuration
 *
 * Defines queues and workers for background job processing,
 * primarily for the reminder system.
 */

import { Queue } from "bullmq";
import { redis } from "./redis";

export const REMINDER_QUEUE = "reminders";
export const EMAIL_QUEUE = "emails";

export const reminderQueue = new Queue(REMINDER_QUEUE, {
  connection: redis as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 60000,
    },
  },
});

export const emailQueue = new Queue(EMAIL_QUEUE, {
  connection: redis as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 30000,
    },
  },
});

interface ReminderJobData {
  reminderId: string;
  userId: string;
  vehicleId: string;
  type: "MOT" | "TAX" | "SERVICE";
  email: string;
  vehicleReg: string;
  vehicleMake: string;
  vehicleModel: string;
  dueDate: string;
  daysRemaining: number;
}

export async function scheduleReminder(data: ReminderJobData): Promise<void> {
  const jobId = `reminder:${data.reminderId}`;
  await reminderQueue.add(jobId, data, {
    jobId,
    delay: 0, // Run immediately when polled by worker
  });
}

export async function scheduleEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  await emailQueue.add("send-email", {
    to,
    subject,
    html,
  });
}
