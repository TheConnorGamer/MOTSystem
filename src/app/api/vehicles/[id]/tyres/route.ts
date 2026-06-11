import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  changedDate: z.string().datetime(),
  treadDepth: z.number().optional().nullable(),
  brand: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

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
  });
  if (!vehicle) {
    return NextResponse.json({ message: "Vehicle not found" }, { status: 404 });
  }

  const records = await prisma.tyreRecord.findMany({
    where: { vehicleId: params.id },
    orderBy: { changedDate: "desc" },
  });

  return NextResponse.json(records);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!vehicle) {
    return NextResponse.json({ message: "Vehicle not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const record = await prisma.tyreRecord.create({
      data: {
        userId: session.user.id,
        vehicleId: params.id,
        changedDate: new Date(parsed.data.changedDate),
        treadDepth: parsed.data.treadDepth,
        brand: parsed.data.brand,
        notes: parsed.data.notes,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("[TYRES] POST error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
