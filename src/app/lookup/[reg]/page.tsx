import Link from "next/link";
import { lookupVehicle } from "@/lib/dvsa";
import { AppShell } from "@/components/app-shell";
import { VehicleLookupResult } from "@/components/vehicle-lookup-result";
import { UkPlateDisplay } from "@/components/uk-plate-display";
import { isValidReg } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { ManualVehicleEntry } from "@/components/manual-vehicle-entry";

interface LookupPageProps {
  params: { reg: string };
}

export async function generateMetadata({ params }: LookupPageProps) {
  const reg = decodeURIComponent(params.reg);
  return {
    title: `Vehicle Lookup: ${reg} | VehicleGuard UK`,
  };
}

export default async function LookupPage({ params }: LookupPageProps) {
  const reg = decodeURIComponent(params.reg);

  if (!isValidReg(reg)) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl text-center py-8">
            <h1 className="text-2xl font-bold">Invalid Registration</h1>
            <p className="mt-4 text-muted-foreground">
              <strong>{reg}</strong> does not appear to be a valid UK registration number.
            </p>
            <Link href="/">
              <Button className="mt-6">
                <Search className="mr-2 h-4 w-4" />
                Try Another
              </Button>
            </Link>
        </div>
      </AppShell>
    );
  }

  let result;
  try {
    result = await lookupVehicle(reg);
  } catch (error) {
    console.error(`[LOOKUP] Failed for ${reg}:`, error);
    // Return a graceful error page
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl space-y-6 py-4">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-600 to-slate-800 p-6 text-center text-white shadow-xl">
            <UkPlateDisplay registration={reg} size="lg" className="mx-auto" />
            <h1 className="mt-4 text-xl font-bold">No MOT History Available</h1>
            <p className="mt-2 text-sm text-white/80">
              We couldn&apos;t find DVSA records for this registration.
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5 text-left shadow-sm">
            <p className="mb-2 font-semibold">This usually means:</p>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>Vehicle is <strong>under 3 years old</strong> — no MOT yet</li>
              <li>Registration number is <strong>incorrect</strong></li>
              <li>Recently <strong>imported</strong> — records not added yet</li>
              <li>Temporary <strong>DVSA API</strong> issue</li>
            </ul>
          </div>

          <div className="flex justify-center gap-3">
            <Link href="/">
              <Button variant="outline">
                <Search className="mr-2 h-4 w-4" />
                Try Another
              </Button>
            </Link>
          </div>

          <ManualVehicleEntry registration={reg} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <VehicleLookupResult data={result} />
    </AppShell>
  );
}
