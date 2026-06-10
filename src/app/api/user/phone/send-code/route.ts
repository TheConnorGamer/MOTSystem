import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPhoneVerificationCode } from "@/lib/phone-verify";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phoneNumber: true },
  });

  if (!user?.phoneNumber) {
    return NextResponse.json(
      { message: "Save a mobile number first" },
      { status: 400 }
    );
  }

  try {
    await sendPhoneVerificationCode(session.user.id, user.phoneNumber);
    return NextResponse.json({ message: "Verification code sent" });
  } catch (error) {
    console.error("[PHONE SEND CODE] Error:", error);
    return NextResponse.json(
      { message: "Failed to send verification code" },
      { status: 500 }
    );
  }
}
