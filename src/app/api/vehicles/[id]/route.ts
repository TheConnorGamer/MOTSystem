import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  taxDueDate: z.string().datetime().optional().nullable(),
  taxStatus: z.enum(["TAXED", "SORN", "UNTAXED", "UNKNOWN"]).optional().nullable(),
  motDueDate: z.string().datetime().optional().nullable(),
  nextServiceDate: z.string().datetime().optional().nullable(),
  lastServiceDate: z.string().datetime().optional().nullable(),
  serviceIntervalMiles: z.number().optional().nullable(),
  serviceIntervalMonths: z.number().optional().nullable(),
  insuranceDueDate: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
  mileage: z.number().optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!vehicle) {
      return NextResponse.json(
        { message: "Vehicle not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Build update object dynamically
    const updateData: Record<string, unknown> = {};
    if (data.taxDueDate !== undefined) updateData.taxDueDate = data.taxDueDate ? new Date(data.taxDueDate) : null;
    if (data.taxStatus !== undefined) updateData.taxStatus = data.taxStatus;
    if (data.motDueDate !== undefined) updateData.motDueDate = data.motDueDate ? new Date(data.motDueDate) : null;
    if (data.nextServiceDate !== undefined) updateData.nextServiceDate = data.nextServiceDate ? new Date(data.nextServiceDate) : null;
    if (data.lastServiceDate !== undefined) updateData.lastServiceDate = data.lastServiceDate ? new Date(data.lastServiceDate) : null;
    if (data.serviceIntervalMiles !== undefined) updateData.serviceIntervalMiles = data.serviceIntervalMiles;
    if (data.serviceIntervalMonths !== undefined) updateData.serviceIntervalMonths = data.serviceIntervalMonths;
    if (data.insuranceDueDate !== undefined) updateData.insuranceDueDate = data.insuranceDueDate ? new Date(data.insuranceDueDate) : null;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.mileage !== undefined) updateData.mileage = data.mileage;

    const updated = await prisma.vehicle.update({
      where: { id: params.id },
      data: updateData,
    });

    // Re-create reminders if dates changed
    if (data.motDueDate || data.taxDueDate || data.nextServiceDate) {
      // Delete future pending reminders for this vehicle
      await prisma.reminder.deleteMany({
        where: {
          vehicleId: params.id,
          status: "PENDING",
          sentAt: null,
        },
      });

      const reminderDays = [30, 14, 7];
      if (updated.motDueDate) {
        for (const days of reminderDays) {
          const due = new Date(updated.motDueDate);
          due.setDate(due.getDate() - days);
          await prisma.reminder.create({
            data: {
              userId: session.user.id,
              vehicleId: updated.id,
              type: "MOT",
              dueDate: due,
              daysBefore: days,
            },
          });
        }
      }
      if (updated.taxDueDate) {
        for (const days of reminderDays) {
          const due = new Date(updated.taxDueDate);
          due.setDate(due.getDate() - days);
          await prisma.reminder.create({
            data: {
              userId: session.user.id,
              vehicleId: updated.id,
              type: "TAX",
              dueDate: due,
              daysBefore: days,
            },
          });
        }
      }
      if (updated.nextServiceDate) {
        for (const days of reminderDays) {
          const due = new Date(updated.nextServiceDate);
          due.setDate(due.getDate() - days);
          await prisma.reminder.create({
            data: {
              userId: session.user.id,
              vehicleId: updated.id,
              type: "SERVICE",
              dueDate: due,
              daysBefore: days,
            },
          });
        }
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[VEHICLES PATCH] Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // Verify ownership
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!vehicle) {
      return NextResponse.json(
        { message: "Vehicle not found" },
        { status: 404 }
      );
    }

    await prisma.vehicle.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Vehicle deleted" });
  } catch (error) {
    console.error("[VEHICLES DELETE] Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
