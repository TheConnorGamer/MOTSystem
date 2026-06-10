"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Car,
  Calendar,
  Gauge,
  AlertTriangle,
  Plus,
  Trash2,
  Download,
  Wrench,
  ChevronRight,
  Bell,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import { VehicleLookupForm } from "@/components/vehicle-lookup-form";
import { EditVehicleDialog } from "@/components/edit-vehicle-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDate, daysUntil, getStatusBadgeClass } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface DashboardVehicle {
  id: string;
  registration: string;
  make: string | null;
  model: string | null;
  colour: string | null;
  motDueDate: string | null;
  taxDueDate: string | null;
  lastMotDate: string | null;
  lastServiceDate: string | null;
  nextServiceDate: string | null;
  serviceIntervalMiles: number | null;
  serviceIntervalMonths: number | null;
  motStatus: string;
  taxStatus: string;
  insuranceDueDate: string | null;
  notes: string | null;
  mileage: number | null;
  motHistoryJson: string | null;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<DashboardVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchVehicles();
    }
  }, [status]);

  async function fetchVehicles() {
    try {
      const res = await fetch("/api/vehicles");
      if (res.ok) {
        const data = await res.json();
        setVehicles(data);
      }
    } catch {
      toast({ title: "Failed to load vehicles", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function deleteVehicle(id: string) {
    if (!confirm("Are you sure you want to remove this vehicle?")) return;

    try {
      const res = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
      if (res.ok) {
        setVehicles((prev) => prev.filter((v) => v.id !== id));
        toast({ title: "Vehicle removed" });
      } else {
        toast({ title: "Failed to remove vehicle", variant: "destructive" });
      }
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container py-12">
          <div className="space-y-4">
            <div className="h-8 w-48 rounded bg-muted animate-pulse" />
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const urgentVehicles = vehicles.filter((v) => {
    const motDays = daysUntil(v.motDueDate);
    const taxDays = daysUntil(v.taxDueDate);
    const serviceDays = daysUntil(v.nextServiceDate);
    return (
      (motDays !== null && motDays <= 14) ||
      (taxDays !== null && taxDays <= 14) ||
      (serviceDays !== null && serviceDays <= 14)
    );
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container py-8">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">My Garage</h1>
              <p className="text-muted-foreground">
                Welcome back, {session?.user?.name || session?.user?.email}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/settings">
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const res = await fetch("/api/reminders/send", { method: "POST" });
                    const data = await res.json();
                    if (data.sent > 0) {
                      toast({ title: `${data.sent} reminder(s) sent!` });
                    } else {
                      toast({ title: "No reminders due right now" });
                    }
                  } catch {
                    toast({ title: "Failed to check reminders", variant: "destructive" });
                  }
                }}
              >
                <Bell className="mr-2 h-4 w-4" />
                Check Reminders
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Vehicle
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Lookup a Vehicle</DialogTitle>
                  </DialogHeader>
                  <VehicleLookupForm />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Alerts */}
          {urgentVehicles.length > 0 && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold">
                  {urgentVehicles.length} vehicle{urgentVehicles.length !== 1 ? "s" : ""} need attention
                </span>
              </div>
            </div>
          )}

          {/* Vehicle Grid */}
          {vehicles.length === 0 ? (
            <div className="rounded-xl border bg-card p-12 text-center">
              <Car className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No vehicles yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Search for a vehicle by registration to get started.
              </p>
              <div className="mx-auto mt-6 max-w-md">
                <VehicleLookupForm />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {vehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onDelete={() => deleteVehicle(vehicle.id)}
                  onUpdate={fetchVehicles}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function VehicleCard({
  vehicle,
  onDelete,
  onUpdate,
}: {
  vehicle: DashboardVehicle;
  onDelete: () => void;
  onUpdate: () => void;
}) {
  const motDays = daysUntil(vehicle.motDueDate);
  const taxDays = daysUntil(vehicle.taxDueDate);
  const serviceDays = daysUntil(vehicle.nextServiceDate);
  const insuranceDays = daysUntil(vehicle.insuranceDueDate);

  const needsAttention =
    (motDays !== null && motDays <= 14) ||
    (taxDays !== null && taxDays <= 14) ||
    (serviceDays !== null && serviceDays <= 14) ||
    (insuranceDays !== null && insuranceDays <= 14);

  return (
    <Card className={needsAttention ? "border-yellow-400 dark:border-yellow-600" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Car className="h-5 w-5 text-gov-blue" />
              {vehicle.registration}
              {!vehicle.motHistoryJson && (
                <Badge variant="outline" className="text-xs font-normal">Manual</Badge>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {vehicle.make} {vehicle.model}
            </p>
          </div>
          <div className="flex">
            <EditVehicleDialog vehicle={vehicle} onUpdated={onUpdate} />
            <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <StatusRow
            label="MOT"
            date={vehicle.motDueDate}
            icon={<Calendar className="h-4 w-4" />}
          />
          <StatusRow
            label="Tax"
            date={vehicle.taxDueDate}
            icon={<Calendar className="h-4 w-4" />}
          />
          {vehicle.nextServiceDate && (
            <StatusRow
              label="Service"
              date={vehicle.nextServiceDate}
              icon={<Wrench className="h-4 w-4" />}
            />
          )}
          {vehicle.insuranceDueDate && (
            <StatusRow
              label="Insurance"
              date={vehicle.insuranceDueDate}
              icon={<Gauge className="h-4 w-4" />}
            />
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Link href={`/lookup/${vehicle.registration}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              Details <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="px-2">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusRow({
  label,
  date,
  icon,
}: {
  label: string;
  date: string | null;
  icon: React.ReactNode;
}) {
  const days = daysUntil(date);
  const color =
    days === null
      ? "gray"
      : days < 0
      ? "red"
      : days <= 14
      ? "yellow"
      : "green";

  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-right">
        <span className="font-medium">{formatDate(date)}</span>
        {days !== null && (
          <span
            className={`ml-2 text-xs font-medium ${
              color === "red"
                ? "text-red-600"
                : color === "yellow"
                ? "text-yellow-600"
                : "text-green-600"
            }`}
          >
            {days < 0
              ? `(${Math.abs(days)}d overdue)`
              : `(${days}d left)`}
          </span>
        )}
      </div>
    </div>
  );
}
