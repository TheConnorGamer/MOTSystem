import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { verifyPhoneCode } from "@/lib/phone-verify";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  code: z.string().length(6),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid code" }, { status: 400 });
  }

  const ok = await verifyPhoneCode(session.user.id, parsed.data.code);
  if (!ok) {
    return NextResponse.json(
      { message: "Invalid or expired code" },
      { status: 400 }
    );
  }

  return NextResponse.json({ message: "Phone verified", phoneVerified: true });
}
