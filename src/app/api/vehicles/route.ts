import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  registration: z.string().min(1),
  make: z.string().optional(),
  model: z.string().optional(),
  colour: z.string().optional(),
  fuelType: z.string().optional(),
  yearOfManufacture: z.number().optional(),
  motDueDate: z.string().datetime().optional().nullable(),
  taxDueDate: z.string().datetime().optional().nullable(),
  motStatus: z.enum(["VALID", "EXPIRED", "NO_TESTS"]).optional(),
  taxStatus: z.enum(["TAXED", "SORN", "UNTAXED", "UNKNOWN"]).optional(),
  motHistoryJson: z.any().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const vehicles = await prisma.vehicle.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(vehicles);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check for duplicate
    const existing = await prisma.vehicle.findUnique({
      where: {
        userId_registration: {
          userId: session.user.id,
          registration: data.registration.replace(/\s/g, "").toUpperCase(),
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Vehicle already in garage" },
        { status: 409 }
      );
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        userId: session.user.id,
        registration: data.registration.replace(/\s/g, "").toUpperCase(),
        make: data.make,
        model: data.model,
        colour: data.colour,
        fuelType: data.fuelType,
        yearOfManufacture: data.yearOfManufacture,
        motDueDate: data.motDueDate ? new Date(data.motDueDate) : undefined,
        taxDueDate: data.taxDueDate ? new Date(data.taxDueDate) : undefined,
        motStatus: data.motStatus,
        taxStatus: data.taxStatus,
        motHistoryJson: data.motHistoryJson ? JSON.stringify(data.motHistoryJson) : undefined,
        cachedAt: new Date(),
      },
    });

    // Create default reminders
    const reminderDays = [30, 14, 7];
    if (vehicle.motDueDate) {
      for (const days of reminderDays) {
        const due = new Date(vehicle.motDueDate);
        due.setDate(due.getDate() - days);
        await prisma.reminder.create({
          data: {
            userId: session.user.id,
            vehicleId: vehicle.id,
            type: "MOT",
            dueDate: due,
            daysBefore: days,
          },
        });
      }
    }

    if (vehicle.taxDueDate) {
      for (const days of reminderDays) {
        const due = new Date(vehicle.taxDueDate);
        due.setDate(due.getDate() - days);
        await prisma.reminder.create({
          data: {
            userId: session.user.id,
            vehicleId: vehicle.id,
            type: "TAX",
            dueDate: due,
            daysBefore: days,
          },
        });
      }
    }

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    console.error("[VEHICLES] POST error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
