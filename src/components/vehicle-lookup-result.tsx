"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Car,
  Calendar,
  Gauge,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  Plus,
  FileWarning,
  TrendingUp,
  MapPin,
} from "lucide-react";
import { VehicleLookupResult as VehicleResult } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDate, daysUntil, getStatusBadgeClass } from "@/lib/utils";
import { generateVehicleReport } from "@/lib/pdf-report";
import { useToast } from "@/hooks/use-toast";

interface Props {
  data: VehicleResult;
}

export function VehicleLookupResult({ data }: Props) {
  const { data: session } = useSession();
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const motDays = daysUntil(data.motDueDate);
  const motExpired = motDays !== null && motDays < 0;
  const motUrgent = motDays !== null && motDays <= 14 && motDays >= 0;

  async function handleSaveVehicle() {
    if (!session?.user) return;
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
        toast({ title: "Vehicle saved to your garage" });
      } else {
        const err = await response.json();
        toast({
          title: "Failed to save vehicle",
          description: err.message,
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  function handleDownloadPDF() {
    const doc = generateVehicleReport(data);
    doc.save(`VehicleGuard-${data.registration}.pdf`);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Car className="h-8 w-8 text-gov-blue" />
            {data.registration}
          </h1>
          <p className="text-muted-foreground">
            {data.make} {data.model} &bull; {data.colour} &bull;{" "}
            {data.fuelType}
          </p>
        </div>
        <div className="flex gap-2">
          {session?.user && (
            <Button onClick={handleSaveVehicle} disabled={saving} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save to Garage"}
            </Button>
          )}
          <Button onClick={handleDownloadPDF} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            PDF Report
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatusCard
          title="MOT Status"
          date={data.motDueDate}
          icon={<Calendar className="h-5 w-5" />}
          valid={data.motStatus === "VALID"}
          expired={motExpired}
          urgent={motUrgent}
        />
        <StatusCard
          title="Tax Status"
          date={data.taxDueDate}
          icon={<CheckCircle className="h-5 w-5" />}
          valid={data.taxStatus === "TAXED" ? true : data.taxStatus === "UNKNOWN" ? undefined : false}
          unknown={data.taxStatus === "UNKNOWN"}
        />
        <StatusCard
          title="Last MOT Mileage"
          value={
            data.lastMotMileage
              ? `${data.lastMotMileage.toLocaleString()} miles`
              : undefined
          }
          icon={<Gauge className="h-5 w-5" />}
        />
      </div>

      {/* Warnings */}
      {data.mileageAnomaly && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-semibold">Mileage Anomaly Detected</span>
          </div>
          <p className="mt-1 text-sm">
            Inconsistent mileage readings detected in the MOT history. This may
            indicate odometer tampering or data entry errors.
          </p>
        </div>
      )}

      {/* Estimated Value */}
      {data.estimatedValue && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gov-green" />
              Estimated Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gov-green">
              {new Intl.NumberFormat("en-GB", {
                style: "currency",
                currency: "GBP",
                maximumFractionDigits: 0,
              }).format(data.estimatedValue)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Approximate value based on age. For a precise valuation, please
              consult a professional appraiser.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Common Failures */}
      {data.commonFailures.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileWarning className="h-5 w-5 text-gov-red" />
              Common Issues for This Model
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.commonFailures.map((failure, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <XCircle className="mt-0.5 h-4 w-4 text-red-500 shrink-0" />
                  {failure}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* MOT History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">MOT Test History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.motHistory.slice(0, 5).map((test) => (
              <div
                key={test.testId}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        test.testResult === "PASSED" ? "default" : "destructive"
                      }
                    >
                      {test.testResult}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(test.completedDate)}
                    </span>
                  </div>
                  {test.odometerValue > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {test.odometerValue.toLocaleString()} {test.odometerUnit}
                    </p>
                  )}
                </div>
                {(test.rfrAndComments || []).length > 0 && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        {(test.rfrAndComments || []).length} item
                        {(test.rfrAndComments || []).length !== 1 ? "s" : ""}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          MOT Details - {formatDate(test.completedDate)}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {(test.rfrAndComments || []).map((comment, i) => (
                          <div
                            key={i}
                            className={`rounded-md p-3 text-sm ${
                              comment.type === "ADVISORY"
                                ? "bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
                                : comment.type === "FAIL" ||
                                  comment.type === "MAJOR" ||
                                  comment.type === "DANGEROUS"
                                ? "bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800"
                                : "bg-gray-50 border dark:bg-gray-800"
                            }`}
                          >
                            <Badge
                              variant={
                                comment.type === "ADVISORY"
                                  ? "outline"
                                  : "destructive"
                              }
                              className="mb-1"
                            >
                              {comment.type}
                            </Badge>
                            <p>{comment.text}</p>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Book a Test */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-gov-blue" />
            Book an MOT Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Find an approved MOT test centre near you.
          </p>
          <a
            href={`https://www.google.com/maps/search/MOT+test+centre+near+me`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button>Find MOT Centres</Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusCard({
  title,
  date,
  value,
  icon,
  valid,
  expired,
  urgent,
  unknown,
}: {
  title: string;
  date?: Date;
  value?: string;
  icon: React.ReactNode;
  valid?: boolean;
  expired?: boolean;
  urgent?: boolean;
  unknown?: boolean;
}) {
  const days = daysUntil(date);
  const statusColor = expired ? "red" : urgent ? "yellow" : valid ? "green" : "gray";

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            {icon}
            <span className="text-sm font-medium">{title}</span>
          </div>
          {unknown ? (
            <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300">
              Unknown
            </Badge>
          ) : valid !== undefined && (
            <Badge
              variant={valid ? "default" : "destructive"}
              className={
                valid
                  ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300"
                  : ""
              }
            >
              {valid ? "Valid" : "Expired"}
            </Badge>
          )}
        </div>
        <div className="mt-3">
          {date ? (
            <>
              <p className="text-2xl font-bold">{formatDate(date)}</p>
              {days !== null && (
                <p
                  className={`mt-1 text-sm font-medium ${
                    statusColor === "red"
                      ? "text-red-600"
                      : statusColor === "yellow"
                      ? "text-yellow-600"
                      : "text-green-600"
                  }`}
                >
                  {days < 0
                    ? `Expired ${Math.abs(days)} days ago`
                    : `${days} days remaining`}
                </p>
              )}
            </>
          ) : value ? (
            <p className="text-2xl font-bold">{value}</p>
          ) : (
            <p className="text-2xl font-bold text-muted-foreground">N/A</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
