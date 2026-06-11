"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Car, Plus, CalendarClock, Warehouse } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { GarageToolbar } from "@/components/garage-toolbar";
import { GarageVehicleCard } from "@/components/garage-vehicle-card";
import { VehicleLookupForm } from "@/components/vehicle-lookup-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type GarageFilter,
  type GarageSort,
  type GarageVehicle,
  filterVehicles,
  needsAttention,
  sortVehicles,
  getSoonestDays,
} from "@/lib/garage";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<GarageVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<GarageFilter>("all");
  const [sort, setSort] = useState<GarageSort>("urgency");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") fetchVehicles();
  }, [status]);

  async function fetchVehicles() {
    try {
      const res = await fetch("/api/vehicles");
      if (res.ok) setVehicles(await res.json());
    } catch {
      toast({ title: "Failed to load garage", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(
    () => sortVehicles(filterVehicles(vehicles, filter, search), sort),
    [vehicles, filter, search, sort]
  );

  const attentionCount = vehicles.filter(needsAttention).length;
  const soonest = vehicles
    .map((v) => getSoonestDays(v))
    .filter((d): d is number => d !== null);
  const nextDueDays = soonest.length ? Math.min(...soonest) : null;

  if (status === "loading" || loading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl space-y-6">
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-36 w-full rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-[#1d70b8] to-[#003078] p-2.5 text-white shadow-md">
              <Warehouse className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">My Garage</h1>
              <p className="text-sm text-muted-foreground">Your vehicles &amp; deadlines</p>
            </div>
          </div>
          <Link href="/add" className="hidden sm:block">
            <Button className="rounded-full bg-gradient-to-r from-[#1d70b8] to-[#00703c] shadow-md">
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </Link>
        </div>

        {vehicles.length === 0 ? (
          <VehicleLookupForm />
        ) : (
          <>
            <div className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow">
              Garage updated · {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} saved
            </div>

            <div className="grid grid-cols-3 gap-2">
              <StatTile
                icon={<Car className="h-4 w-4" />}
                value={vehicles.length}
                label="Vehicles"
                color="blue"
              />
              <StatTile
                icon={<AlertTriangle className="h-4 w-4" />}
                value={attentionCount}
                label="Attention"
                color={attentionCount > 0 ? "amber" : "slate"}
              />
              <StatTile
                icon={<CalendarClock className="h-4 w-4" />}
                value={nextDueDays !== null ? `${nextDueDays}d` : "—"}
                label="Next due"
                color="green"
              />
            </div>

            {attentionCount > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 text-sm text-amber-900 dark:from-amber-950/30 dark:to-orange-950/20 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  <strong>{attentionCount}</strong> vehicle{attentionCount !== 1 ? "s" : ""} need
                  attention soon
                </span>
              </div>
            )}

            <GarageToolbar
              search={search}
              onSearchChange={setSearch}
              filter={filter}
              onFilterChange={setFilter}
              sort={sort}
              onSortChange={setSort}
              count={filtered.length}
            />

            {filtered.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">
                No vehicles match your search or filter.
              </p>
            ) : (
              <div className="space-y-3">
                {filtered.map((v) => (
                  <GarageVehicleCard key={v.id} vehicle={v} />
                ))}
              </div>
            )}

            <Link href="/add" className="block sm:hidden">
              <Button className="w-full rounded-full bg-gradient-to-r from-[#1d70b8] to-[#00703c]">
                <Plus className="mr-2 h-4 w-4" />
                Add another vehicle
              </Button>
            </Link>
          </>
        )}
      </div>
    </AppShell>
  );
}

function StatTile({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: "blue" | "amber" | "green" | "slate";
}) {
  const bg = {
    blue: "from-blue-500 to-blue-700",
    amber: "from-amber-500 to-orange-500",
    green: "from-emerald-500 to-emerald-700",
    slate: "from-slate-500 to-slate-700",
  }[color];

  return (
    <div
      className={`rounded-xl bg-gradient-to-br ${bg} p-3 text-white shadow-md`}
    >
      <div className="mb-1 opacity-80">{icon}</div>
      <p className="text-xl font-bold leading-none">{value}</p>
      <p className="mt-1 text-[10px] font-medium uppercase tracking-wide opacity-80">
        {label}
      </p>
    </div>
  );
}
