import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseReminderDays, syncVehicleReminders } from "@/lib/reminder-schedule";
import { z } from "zod";

const updateSchema = z.object({
  nickname: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  taxDueDate: z.string().datetime().optional().nullable(),
  taxStatus: z.enum(["TAXED", "SORN", "UNTAXED", "UNKNOWN"]).optional().nullable(),
  motDueDate: z.string().datetime().optional().nullable(),
  motStatus: z.string().optional().nullable(),
  nextServiceDate: z.string().datetime().optional().nullable(),
  lastServiceDate: z.string().datetime().optional().nullable(),
  serviceIntervalMiles: z.number().optional().nullable(),
  serviceIntervalMonths: z.number().optional().nullable(),
  insuranceDueDate: z.string().datetime().optional().nullable(),
  insuranceProvider: z.string().optional().nullable(),
  insurancePolicyNotes: z.string().optional().nullable(),
  warrantyExpiryDate: z.string().datetime().optional().nullable(),
  warrantyNotes: z.string().optional().nullable(),
  breakdownExpiryDate: z.string().datetime().optional().nullable(),
  breakdownProvider: z.string().optional().nullable(),
  tyreChangeDate: z.string().datetime().optional().nullable(),
  tyreNotes: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  mileage: z.number().optional().nullable(),
});

function parseDateField(val: string | null | undefined) {
  if (val === undefined) return undefined;
  return val ? new Date(val) : null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: {
      documents: { orderBy: { createdAt: "desc" } },
      serviceHistory: { orderBy: { serviceDate: "desc" } },
      tyreRecords: { orderBy: { changedDate: "desc" } },
      reminders: {
        where: { status: "PENDING" },
        orderBy: { dueDate: "asc" },
      },
    },
  });

  if (!vehicle) {
    return NextResponse.json({ message: "Vehicle not found" }, { status: 404 });
  }

  return NextResponse.json(vehicle);
}

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
      return NextResponse.json({ message: "Vehicle not found" }, { status: 404 });
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
    const dateFields = [
      "taxDueDate",
      "motDueDate",
      "nextServiceDate",
      "lastServiceDate",
      "insuranceDueDate",
      "warrantyExpiryDate",
      "breakdownExpiryDate",
      "tyreChangeDate",
    ] as const;

    const updateData: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(data)) {
      if (val === undefined) continue;
      if ((dateFields as readonly string[]).includes(key)) {
        updateData[key] = parseDateField(val as string | null);
      } else {
        updateData[key] = val;
      }
    }

    const updated = await prisma.vehicle.update({
      where: { id: params.id },
      data: updateData,
    });

    const dateChanged = dateFields.some((f) => data[f] !== undefined);
    if (dateChanged) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { reminderDaysJson: true },
      });
      const reminderDays = parseReminderDays(user?.reminderDaysJson);
      await syncVehicleReminders(
        session.user.id,
        updated.id,
        updated,
        reminderDays
      );
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
  _req: NextRequest,
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
      return NextResponse.json({ message: "Vehicle not found" }, { status: 404 });
    }

    await prisma.vehicle.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Vehicle deleted" });
  } catch (error) {
    console.error("[VEHICLES DELETE] Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
