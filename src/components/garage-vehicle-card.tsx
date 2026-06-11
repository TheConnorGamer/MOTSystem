"use client";

import Link from "next/link";
import Image from "next/image";
import { Camera, ChevronRight, Car } from "lucide-react";
import { UkPlateDisplay } from "@/components/uk-plate-display";
import { StatusPill } from "@/components/status-pill";
import { type GarageVehicle, getWorstUrgency, needsAttention } from "@/lib/garage";
import { cn, daysUntil } from "@/lib/utils";

interface GarageVehicleCardProps {
  vehicle: GarageVehicle;
}

const urgencyAccent: Record<string, string> = {
  overdue: "from-red-500 to-red-600",
  urgent: "from-orange-500 to-amber-500",
  soon: "from-amber-400 to-yellow-500",
  ok: "from-emerald-500 to-emerald-600",
  unknown: "from-slate-400 to-slate-500",
};

export function GarageVehicleCard({ vehicle }: GarageVehicleCardProps) {
  const urgency = getWorstUrgency(vehicle);
  const attention = needsAttention(vehicle);
  const displayName =
    vehicle.nickname ||
    [vehicle.make, vehicle.model].filter(Boolean).join(" ") ||
    "Vehicle";
  const subtitle = [vehicle.make, vehicle.model, vehicle.yearOfManufacture]
    .filter(Boolean)
    .join(" ");

  const motDays = daysUntil(vehicle.motDueDate);
  const taxDays = daysUntil(vehicle.taxDueDate);

  function deadlineBadge(
    label: string,
    days: number | null
  ): { text: string; className: string } | null {
    if (days === null) return null;
    if (days < 0)
      return {
        text: `${label} ${Math.abs(days)}d overdue`,
        className: "bg-red-500 text-white",
      };
    if (days <= 14)
      return {
        text: `${label} ${days} days`,
        className: "bg-orange-500 text-white",
      };
    return {
      text: `${label} ${days} days`,
      className: "bg-emerald-500 text-white",
    };
  }

  const motBadge = deadlineBadge("MOT", motDays);
  const taxBadge = deadlineBadge("TAX", taxDays);

  return (
    <Link href={`/vehicles/${vehicle.id}`}>
      <article
        className={cn(
          "group relative flex overflow-hidden rounded-2xl border bg-card shadow-md transition-all hover:shadow-lg",
          attention && "border-amber-300"
        )}
      >
        {/* Left accent stripe */}
        <div
          className={cn(
            "w-1.5 shrink-0 bg-gradient-to-b",
            urgencyAccent[urgency]
          )}
        />

        <div className="flex flex-1 gap-3 p-3 sm:gap-4 sm:p-4">
          <div className="flex w-[92px] shrink-0 flex-col gap-2 sm:w-[108px]">
            <UkPlateDisplay registration={vehicle.registration} size="sm" />
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br from-[#1d70b8]/20 via-[#003078]/10 to-emerald-500/20 ring-1 ring-black/5">
              {vehicle.photoUrl ? (
                <Image
                  src={vehicle.photoUrl}
                  alt={displayName}
                  fill
                  className="object-cover"
                  unoptimized={vehicle.photoUrl.startsWith("data:")}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-1">
                  <div className="rounded-full bg-[#1d70b8]/15 p-2">
                    <Car className="h-6 w-6 text-[#1d70b8]/60" />
                  </div>
                  <span className="flex items-center gap-0.5 text-[9px] font-semibold text-[#1d70b8]/70">
                    <Camera className="h-3 w-3" />
                    Add photo
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold uppercase leading-tight tracking-tight sm:text-base">
                  {[vehicle.make, vehicle.model].filter(Boolean).join(" ") ||
                    vehicle.registration}
                </p>
                {subtitle && (
                  <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
                )}
                {vehicle.nickname && (
                  <p className="truncate text-sm font-semibold text-[#1d70b8] dark:text-blue-400">
                    {vehicle.nickname}
                  </p>
                )}
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/30 transition-all group-hover:translate-x-0.5 group-hover:text-[#1d70b8]" />
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {motBadge && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                    motBadge.className
                  )}
                >
                  ▶ {motBadge.text}
                </span>
              )}
              {taxBadge && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                    taxBadge.className
                  )}
                >
                  £ {taxBadge.text}
                </span>
              )}
            </div>

            <div className="mt-3 grid grid-cols-6 gap-1">
              <StatusPill label="MOT" date={vehicle.motDueDate} compact />
              <StatusPill label="TAX" date={vehicle.taxDueDate} compact />
              <StatusPill label="INS" date={vehicle.insuranceDueDate} compact />
              <StatusPill label="SERV" date={vehicle.nextServiceDate} compact />
              <StatusPill label="WARR" date={vehicle.warrantyExpiryDate} compact />
              <StatusPill label="BRK" date={vehicle.breakdownExpiryDate} compact />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
