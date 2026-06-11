"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  Download,
  Plus,
  FileWarning,
  TrendingUp,
  Gauge,
  Fuel,
  Palette,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { VehicleLookupResult as VehicleResult } from "@/types";
import { Button } from "@/components/ui/button";
import { UkPlateDisplay } from "@/components/uk-plate-display";
import { StatusCard } from "@/components/status-card";
import { LookupMetricCard } from "@/components/lookup-metric-card";
import { MotHistoryList } from "@/components/mot-history-list";
import { VehicleActionGrid } from "@/components/vehicle-action-grid";
import { TaxReminderPanel } from "@/components/tax-reminder-panel";
import { formatDate } from "@/lib/utils";
import { generateVehicleReport } from "@/lib/pdf-report";
import { useToast } from "@/hooks/use-toast";

interface Props {
  data: VehicleResult;
}

export function VehicleLookupResult({ data }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [savedVehicleId, setSavedVehicleId] = useState<string | null>(null);
  const { toast } = useToast();

  async function handleSaveVehicle() {
    if (!session?.user) {
      toast({
        title: "Sign in to save",
        description: "Create a free account to add this to your garage.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registration: data.registration,
          make: data.make,
          model: data.model,
          colour: data.colour,
          fuelType: data.fuelType,
          yearOfManufacture: data.yearOfManufacture,
          motDueDate: data.motDueDate,
          taxDueDate: data.taxDueDate,
          motStatus: data.motStatus,
          taxStatus: data.taxStatus,
          motHistoryJson: data.motHistory,
        }),
      });
      if (response.ok) {
        const vehicle = await response.json();
        setSavedVehicleId(vehicle.id);
        toast({
          title: "Saved to your garage!",
          description: "Opening vehicle profile…",
        });
        router.push(`/vehicles/${vehicle.id}`);
      } else {
        const err = await response.json();
        toast({
          title: err.message === "Vehicle already in garage" ? "Already saved" : "Failed to save",
          description: err.message === "Vehicle already in garage" ? "Check your garage." : err.message,
          variant: err.message === "Vehicle already in garage" ? "default" : "destructive",
        });
        if (err.message === "Vehicle already in garage") {
          router.push("/dashboard");
        }
      }
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  function handleDownloadPDF() {
    generateVehicleReport(data).save(`VehicleGuard-${data.registration}.pdf`);
  }

  const vehicleTitle =
    [data.make, data.model].filter(Boolean).join(" ") || "Vehicle Details";

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-8">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#003078] via-[#1d70b8] to-[#00703c] p-5 text-white shadow-xl sm:p-6">
        <div className="flex items-center justify-between">
          <Link href={session ? "/dashboard" : "/"}>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-1 text-xs text-white/70">
            <ShieldCheck className="h-3.5 w-3.5" />
            DVSA Powered
          </div>
        </div>

        <div className="mt-4 flex flex-col items-center text-center">
          <UkPlateDisplay registration={data.registration} size="lg" />
          <h1 className="mt-3 text-xl font-bold uppercase tracking-wide sm:text-2xl">
            {vehicleTitle}
          </h1>
          <p className="mt-1 text-sm text-blue-100">
            {[data.yearOfManufacture, data.colour, data.fuelType]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {session?.user ? (
            <Button
              onClick={handleSaveVehicle}
              disabled={saving}
              className="rounded-full bg-white font-bold text-[#003078] hover:bg-blue-50"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Save to Garage
            </Button>
          ) : (
            <Link href="/auth/signup">
              <Button className="rounded-full bg-white font-bold text-[#003078] hover:bg-blue-50">
                <Plus className="mr-2 h-4 w-4" />
                Sign up &amp; Save
              </Button>
            </Link>
          )}
          <Button
            onClick={handleDownloadPDF}
            variant="outline"
            className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20"
          >
            <Download className="mr-2 h-4 w-4" />
            PDF Report
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <StatusCard
          title={data.motStatus === "VALID" ? "MOT Valid" : "MOT"}
          date={data.motDueDate}
        />
        {data.taxDueDate ? (
          <StatusCard
            title="Taxed"
            date={data.taxDueDate}
            href="https://www.gov.uk/vehicle-tax"
          />
        ) : (
          <StatusCard
            title="Tax"
            unknown
            unknownHint="Not from DVSA — check GOV.UK & add date after saving"
            href="https://www.gov.uk/check-vehicle-tax"
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <LookupMetricCard
          label="Last MOT Mileage"
          value={data.lastMotMileage ? data.lastMotMileage.toLocaleString() : "—"}
          sub={data.lastMotMileage ? "miles at last test" : "No reading"}
          icon={Gauge}
          variant="blue"
        />
        <LookupMetricCard
          label="Advisories"
          value={data.advisoryCount > 0 ? String(data.advisoryCount) : "0"}
          sub={data.advisoryCount > 0 ? "on latest MOT" : "none on latest test"}
          icon={AlertCircle}
          variant={data.advisoryCount > 0 ? "amber" : "green"}
        />
      </div>

      <TaxReminderPanel
        vehicleId={savedVehicleId ?? undefined}
        requireSaveMessage="Save to your garage first — then set a tax reminder here on your vehicle profile."
      />

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="bg-gradient-to-r from-[#003078] to-[#1d70b8] px-4 py-3">
          <h2 className="font-bold text-white">Basic Vehicle Spec</h2>
          <p className="text-xs text-blue-100">DVLA &amp; DVSA data</p>
        </div>
        <div className="divide-y">
          <SpecRow label="Make" value={data.make} />
          <SpecRow label="Model" value={data.model} />
          <SpecRow label="Year" value={data.yearOfManufacture?.toString()} />
          <SpecRow
            label="Colour"
            value={data.colour}
            icon={<Palette className="h-4 w-4 text-purple-500" />}
          />
          <SpecRow
            label="Fuel"
            value={data.fuelType}
            icon={<Fuel className="h-4 w-4 text-emerald-500" />}
          />
          {data.lastMotDate && (
            <SpecRow label="Last MOT" value={formatDate(data.lastMotDate)} />
          )}
          {data.advisoryCount > 0 && (
            <SpecRow
              label="Latest advisories"
              value={`${data.advisoryCount} on last test`}
              highlight="amber"
            />
          )}
        </div>
      </div>

      {data.mileageAnomaly && (
        <div className="flex gap-3 rounded-2xl border border-red-300 bg-gradient-to-r from-red-50 to-orange-50 p-4 dark:from-red-950/30 dark:to-orange-950/20">
          <AlertTriangle className="h-6 w-6 shrink-0 text-red-600" />
          <div>
            <p className="font-bold text-red-800 dark:text-red-300">
              Mileage anomaly detected
            </p>
            <p className="mt-1 text-sm text-red-700/80 dark:text-red-300/80">
              Inconsistent mileage in MOT history — may indicate tampering or data errors.
            </p>
          </div>
        </div>
      )}

      {data.estimatedValue && (
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 p-5 shadow-lg">
          <div className="flex items-center gap-2 text-amber-950">
            <TrendingUp className="h-5 w-5" />
            <span className="text-sm font-bold uppercase tracking-wide">
              Estimated Value
            </span>
          </div>
          <p className="mt-2 text-4xl font-black text-amber-950">
            {new Intl.NumberFormat("en-GB", {
              style: "currency",
              currency: "GBP",
              maximumFractionDigits: 0,
            }).format(data.estimatedValue)}
          </p>
          <p className="mt-2 text-sm text-amber-900/80">
            Approximate based on age. Get a professional valuation for accuracy.
          </p>
        </div>
      )}

      {data.commonFailures.length > 0 && (
        <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-5 dark:from-orange-950/20">
          <div className="flex items-center gap-2 font-bold text-orange-800 dark:text-orange-300">
            <FileWarning className="h-5 w-5" />
            Common issues for this model
          </div>
          <ul className="mt-3 space-y-2">
            {data.commonFailures.map((f, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-lg bg-white/60 px-3 py-2 text-sm dark:bg-black/20"
              >
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">MOT Test History</h2>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
            {data.motHistory.length} test{data.motHistory.length !== 1 ? "s" : ""}
          </span>
        </div>
        <MotHistoryList tests={data.motHistory} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold">Quick actions</h2>
        <VehicleActionGrid
          registration={data.registration}
          vehicleId={savedVehicleId ?? undefined}
        />
      </div>
    </div>
  );
}

function SpecRow({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value?: string | null;
  icon?: React.ReactNode;
  highlight?: "amber";
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`flex items-center gap-1.5 text-sm font-bold uppercase ${
          highlight === "amber" ? "text-amber-600" : ""
        }`}
      >
        {icon}
        {value || "—"}
      </span>
    </div>
  );
}
