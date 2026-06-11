import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { enrichVehicleFromDvsa } from "@/lib/vehicle-enrich";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const vehicle = await enrichVehicleFromDvsa(params.id, session.user.id);
    return NextResponse.json(vehicle);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Refresh failed";
    if (message === "Vehicle not found") {
      return NextResponse.json({ message }, { status: 404 });
    }
    console.error("[VEHICLE REFRESH]", error);
    return NextResponse.json(
      { message: "Could not refresh from DVSA. Try again later." },
      { status: 502 }
    );
  }
}
