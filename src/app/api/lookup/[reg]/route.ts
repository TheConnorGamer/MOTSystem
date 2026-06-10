import { NextRequest, NextResponse } from "next/server";
import { lookupVehicle } from "@/lib/dvsa";
import { isValidReg } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { reg: string } }
) {
  try {
    const reg = decodeURIComponent(params.reg);

    if (!isValidReg(reg)) {
      return NextResponse.json(
        { message: "Invalid registration number" },
        { status: 400 }
      );
    }

    const result = await lookupVehicle(reg);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`[LOOKUP API] Error for ${params.reg}:`, error);

    if (error.message?.includes("Vehicle not found")) {
      return NextResponse.json(
        { message: "Vehicle not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Failed to lookup vehicle" },
      { status: 500 }
    );
  }
}
