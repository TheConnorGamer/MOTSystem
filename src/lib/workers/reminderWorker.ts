/**
 * BullMQ Worker for Processing Reminders
 *
 * This worker processes reminder jobs from the queue and sends emails.
 * Run with: npm run worker
 */

import { Worker } from "bullmq";
import { redis } from "../redis";
import { prisma } from "../prisma";
import { sendReminderEmail } from "../email";
import { REMINDER_QUEUE } from "../queue";

const worker = new Worker(
  REMINDER_QUEUE,
  async (job) => {
    const {
      reminderId,
      userId,
      type,
      email,
      vehicleReg,
      vehicleMake,
      vehicleModel,
      dueDate,
      daysRemaining,
    } = job.data;

    console.log(`[WORKER] Processing reminder ${reminderId}`);

    try {
      await sendReminderEmail(
        email,
        type,
        vehicleReg,
        vehicleMake,
        vehicleModel,
        new Date(dueDate),
        daysRemaining
      );

      // Mark reminder as sent
      await prisma.reminder.update({
        where: { id: reminderId },
        data: { status: "SENT", sentAt: new Date() },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId,
          action: "REMINDER_SENT",
          details: JSON.stringify({ reminderId, type, vehicleReg, daysRemaining }),
        },
      });

      console.log(`[WORKER] Reminder ${reminderId} sent successfully`);
    } catch (error) {
      console.error(`[WORKER] Failed to send reminder ${reminderId}:`, error);

      // Mark as failed
      await prisma.reminder.update({
        where: { id: reminderId },
        data: { status: "FAILED" },
      });

      throw error; // Trigger BullMQ retry
    }
  },
  { connection: redis as any }
);

worker.on("completed", (job) => {
  console.log(`[WORKER] Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[WORKER] Job ${job?.id} failed:`, err);
});

console.log("[WORKER] Reminder worker started");

// Keep process alive
process.on("SIGTERM", async () => {
  console.log("[WORKER] Shutting down...");
  await worker.close();
  process.exit(0);
});
