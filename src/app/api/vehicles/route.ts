import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseReminderDays, syncVehicleReminders } from "@/lib/reminder-schedule";
import {
  fieldsFromLookupResult,
  refreshFromDvsa,
} from "@/lib/vehicle-enrich";
import { z } from "zod";

const createSchema = z.object({
  registration: z.string().min(1),
  nickname: z.string().optional(),
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
  photoUrl: z.string().optional(),
});

export async function GET() {
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
    const reg = data.registration.replace(/\s/g, "").toUpperCase();

    const existing = await prisma.vehicle.findUnique({
      where: {
        userId_registration: {
          userId: session.user.id,
          registration: reg,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Vehicle already in garage" },
        { status: 409 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { reminderDaysJson: true },
    });

    // Auto-fetch latest DVSA data on save (free)
    let enrichFields: Record<string, unknown> = {};
    try {
      const fresh = await refreshFromDvsa(reg);
      enrichFields = fieldsFromLookupResult(fresh, {
        taxDueDate: data.taxDueDate ? new Date(data.taxDueDate) : null,
        taxStatus: data.taxStatus ?? null,
      });
    } catch {
      enrichFields = {
        make: data.make,
        model: data.model,
        colour: data.colour,
        fuelType: data.fuelType,
        yearOfManufacture: data.yearOfManufacture,
        motDueDate: data.motDueDate ? new Date(data.motDueDate) : undefined,
        taxDueDate: data.taxDueDate ? new Date(data.taxDueDate) : undefined,
        motStatus: data.motStatus,
        taxStatus: data.taxStatus,
        motHistoryJson: data.motHistoryJson
          ? JSON.stringify(data.motHistoryJson)
          : undefined,
      };
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        userId: session.user.id,
        registration: reg,
        nickname: data.nickname,
        photoUrl: data.photoUrl,
        cachedAt: new Date(),
        ...enrichFields,
      },
    });

    const reminderDays = parseReminderDays(user?.reminderDaysJson);
    await syncVehicleReminders(session.user.id, vehicle.id, vehicle, reminderDays);

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    console.error("[VEHICLES] POST error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
