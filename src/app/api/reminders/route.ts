import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const reminders = await prisma.reminder.findMany({
    where: { userId: session.user.id },
    include: { vehicle: { select: { registration: true, make: true, model: true } } },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json(reminders);
}
