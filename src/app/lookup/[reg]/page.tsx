import Link from "next/link";
import { lookupVehicle } from "@/lib/dvsa";
import { Navbar } from "@/components/navbar";
import { VehicleLookupResult } from "@/components/vehicle-lookup-result";
import { isValidReg } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Car, Search } from "lucide-react";
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
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container py-12">
          <div className="mx-auto max-w-2xl text-center">
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
        </main>
      </div>
    );
  }

  let result;
  try {
    result = await lookupVehicle(reg);
  } catch (error) {
    console.error(`[LOOKUP] Failed for ${reg}:`, error);
    // Return a graceful error page
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container py-12">
          <div className="mx-auto max-w-2xl text-center space-y-6">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Car className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <h1 className="text-2xl font-bold">No MOT History Available</h1>
            <p className="text-muted-foreground">
              We couldn&apos;t find MOT history for <strong className="text-foreground">{reg}</strong>.
            </p>
            <div className="rounded-lg border bg-muted/50 p-6 text-left max-w-lg mx-auto">
              <p className="font-medium mb-2">This usually means one of the following:</p>
              <ul className="list-inside list-disc text-muted-foreground space-y-1">
                <li>The vehicle is <strong>under 3 years old</strong> and has not had its first MOT yet</li>
                <li>The registration number is <strong>incorrect</strong></li>
                <li>The vehicle was <strong>recently imported</strong> and MOT records have not been added</li>
                <li>There was a temporary issue with the <strong>DVSA API</strong></li>
              </ul>
            </div>
            <p className="text-sm text-muted-foreground">
              Note: Some vehicles with valid MOTs may not appear in the DVSA MOT History API due to data gaps.
              We use the official DVSA database, which can differ from the GOV.UK vehicle enquiry service.
            </p>
            <Link href="/">
              <Button>
                <Search className="mr-2 h-4 w-4" />
                Look Up Another Vehicle
              </Button>
            </Link>

            <ManualVehicleEntry registration={reg} />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container py-8">
        <VehicleLookupResult data={result} />
      </main>
    </div>
  );
}
