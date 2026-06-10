import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().optional(),
  emailRemindersEnabled: z.boolean().optional(),
  smsRemindersEnabled: z.boolean().optional(),
  phoneNumber: z.string().optional().nullable(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        emailRemindersEnabled: true,
        smsRemindersEnabled: true,
        phoneNumber: true,
        phoneVerified: true,
        subscriptionTier: true,
        subscriptionExpiry: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("[USER SETTINGS GET] Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.emailRemindersEnabled !== undefined) updateData.emailRemindersEnabled = data.emailRemindersEnabled;
    if (data.smsRemindersEnabled !== undefined) updateData.smsRemindersEnabled = data.smsRemindersEnabled;
    if (data.phoneNumber !== undefined) {
      const normalized = data.phoneNumber?.trim() || null;
      updateData.phoneNumber = normalized;
      updateData.phoneVerified = Boolean(normalized);
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        name: true,
        email: true,
        emailRemindersEnabled: true,
        smsRemindersEnabled: true,
        phoneNumber: true,
        phoneVerified: true,
        subscriptionTier: true,
        subscriptionExpiry: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[USER SETTINGS PATCH] Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
