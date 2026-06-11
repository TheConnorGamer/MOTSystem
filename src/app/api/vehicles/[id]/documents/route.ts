import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1),
  fileUrl: z.string().min(1),
  fileType: z.string().min(1),
  fileSize: z.number().int().positive(),
  category: z.enum(["MOT", "TAX", "INSURANCE", "SERVICE", "OTHER"]).default("OTHER"),
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

  const documents = await prisma.document.findMany({
    where: { vehicleId: params.id, userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(documents);
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

    const doc = await prisma.document.create({
      data: {
        userId: session.user.id,
        vehicleId: params.id,
        ...parsed.data,
      },
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error("[DOCUMENTS] POST error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
