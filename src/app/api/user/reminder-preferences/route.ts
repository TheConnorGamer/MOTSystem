import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  reminderDays: z.array(z.number().int().positive()).min(1).max(6),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { reminderDaysJson: true },
  });

  return NextResponse.json({
    reminderDaysJson: user?.reminderDaysJson ?? "[30,14,7,1]",
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const uniqueDays = Array.from(new Set(parsed.data.reminderDays)).sort(
      (a, b) => b - a
    );
    const reminderDaysJson = JSON.stringify(uniqueDays);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { reminderDaysJson },
    });

    return NextResponse.json({ reminderDaysJson });
  } catch (error) {
    console.error("[REMINDER PREFS] Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
