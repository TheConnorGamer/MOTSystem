import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  serviceDate: z.string().datetime(),
  mileage: z.number().optional().nullable(),
  description: z.string().min(1),
  garage: z.string().optional().nullable(),
  cost: z.number().optional().nullable(),
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

  const history = await prisma.serviceHistory.findMany({
    where: { vehicleId: params.id },
    orderBy: { serviceDate: "desc" },
  });

  return NextResponse.json(history);
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

    const entry = await prisma.serviceHistory.create({
      data: {
        userId: session.user.id,
        vehicleId: params.id,
        serviceDate: new Date(parsed.data.serviceDate),
        mileage: parsed.data.mileage,
        description: parsed.data.description,
        garage: parsed.data.garage,
        cost: parsed.data.cost,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("[SERVICE HISTORY] POST error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
