import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processDueReminders } from "@/lib/reminders";

export const dynamic = "force-dynamic";

/**
 * Check and send due reminders for the logged-in user (or all users if admin).
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  try {
    const body = await req.json().catch(() => ({}));
    const userId = isAdmin && body.userId ? body.userId : session?.user?.id;

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const result = await processDueReminders(userId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[REMINDERS SEND] Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dueCount = await prisma.reminder.count({
      where: {
        userId: session.user.id,
        status: "PENDING",
        sentAt: null,
        dueDate: { lte: tomorrow },
      },
    });

    return NextResponse.json({ dueCount });
  } catch (error) {
    console.error("[REMINDERS CHECK] Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
