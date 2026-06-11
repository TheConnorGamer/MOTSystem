"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Car,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
  User,
  Gauge,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { UkPlateDisplay } from "@/components/uk-plate-display";
import { StatusCard } from "@/components/status-card";
import { StatusPill } from "@/components/status-pill";
import { VehicleActionGrid } from "@/components/vehicle-action-grid";
import { TaxReminderPanel } from "@/components/tax-reminder-panel";
import { MotHistoryList } from "@/components/mot-history-list";
import { StyledSection } from "@/components/styled-section";
import type { MotTest } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface VehicleDetail {
  id: string;
  registration: string;
  nickname: string | null;
  make: string | null;
  model: string | null;
  colour: string | null;
  fuelType: string | null;
  yearOfManufacture: number | null;
  mileage: number | null;
  photoUrl: string | null;
  motDueDate: string | null;
  taxDueDate: string | null;
  motStatus: string | null;
  taxStatus: string | null;
  lastMotDate: string | null;
  nextServiceDate: string | null;
  lastServiceDate: string | null;
  insuranceDueDate: string | null;
  insuranceProvider: string | null;
  insurancePolicyNotes: string | null;
  warrantyExpiryDate: string | null;
  warrantyNotes: string | null;
  breakdownExpiryDate: string | null;
  breakdownProvider: string | null;
  tyreChangeDate: string | null;
  tyreNotes: string | null;
  notes: string | null;
  motHistoryJson: string | null;
  documents: Array<{
    id: string;
    title: string;
    category: string;
    fileUrl: string;
    createdAt: string;
  }>;
  serviceHistory: Array<{
    id: string;
    serviceDate: string;
    description: string;
    garage: string | null;
    cost: number | null;
    mileage: number | null;
  }>;
  tyreRecords: Array<{
    id: string;
    changedDate: string;
    treadDepth: number | null;
    brand: string | null;
    notes: string | null;
  }>;
}

function toIsoDate(val: string | null | undefined): string {
  if (!val) return "";
  return new Date(val).toISOString().slice(0, 10);
}

function dateToIso(d: string): string | null {
  if (!d) return null;
  return new Date(d + "T12:00:00").toISOString();
}

export function VehicleProfile({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  function goToSection(tab: string, section?: string) {
    setActiveTab(tab);
    setTimeout(() => {
      if (section) {
        document.getElementById(section)?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        document.getElementById("vehicle-tabs")?.scrollIntoView({ behavior: "smooth" });
      }
    }, 80);
  }

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/vehicles/${id}`);
      if (res.status === 404) {
        router.push("/dashboard");
        return;
      }
      if (res.ok) setVehicle(await res.json());
    } catch {
      toast({ title: "Failed to load vehicle", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [id, router, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    const valid = ["overview", "mot", "cover", "service", "tyres", "docs", "notes"];
    if (valid.includes(hash)) setActiveTab(hash);
  }, []);

  async function patch(fields: Record<string, unknown>) {
    try {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (res.ok) {
        await load();
        toast({ title: "Saved" });
      } else {
        toast({ title: "Save failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    }
  }

  async function refreshDvsa() {
    if (!vehicle) return;
    setRefreshing(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}/refresh`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("refresh failed");
      const data = await res.json();
      setVehicle(data);
      toast({ title: "Refreshed from DVSA" });
    } catch {
      toast({ title: "DVSA refresh failed", variant: "destructive" });
    } finally {
      setRefreshing(false);
    }
  }

  async function deleteVehicle() {
    if (!confirm("Remove this vehicle from your garage?")) return;
    const res = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Vehicle removed" });
      router.push("/dashboard");
    }
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !vehicle) return;
    if (file.size > 400_000) {
      toast({
        title: "Image too large",
        description: "Please use an image under 400KB.",
        variant: "destructive",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      patch({ photoUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  }

  async function addService(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/vehicles/${id}/service-history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceDate: dateToIso(fd.get("serviceDate") as string),
        description: fd.get("description"),
        garage: fd.get("garage") || null,
        cost: fd.get("cost") ? parseFloat(fd.get("cost") as string) : null,
        mileage: fd.get("mileage") ? parseInt(fd.get("mileage") as string) : null,
      }),
    });
    if (res.ok) {
      toast({ title: "Service logged" });
      (e.target as HTMLFormElement).reset();
      load();
    }
  }

  async function addTyre(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/vehicles/${id}/tyres`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        changedDate: dateToIso(fd.get("changedDate") as string),
        brand: fd.get("brand") || null,
        treadDepth: fd.get("treadDepth")
          ? parseFloat(fd.get("treadDepth") as string)
          : null,
        notes: fd.get("notes") || null,
      }),
    });
    if (res.ok) {
      toast({ title: "Tyre record added" });
      (e.target as HTMLFormElement).reset();
      load();
    }
  }

  async function addDocument(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const file = fd.get("file") as File;
    if (!file?.size) return;
    if (file.size > 500_000) {
      toast({ title: "File too large (max 500KB)", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const res = await fetch(`/api/vehicles/${id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: fd.get("title") || file.name,
          fileUrl: reader.result,
          fileType: file.type,
          fileSize: file.size,
          category: fd.get("category") || "OTHER",
        }),
      });
      if (res.ok) {
        toast({ title: "Document saved" });
        load();
      }
    };
    reader.readAsDataURL(file);
  }

  if (loading || !vehicle) {
    return (
      <AppShell>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="mt-4 h-10 w-64" />
      </AppShell>
    );
  }

  const displayName =
    vehicle.nickname ||
    [vehicle.make, vehicle.model].filter(Boolean).join(" ") ||
    "Vehicle";

  let motTests: MotTest[] = [];
  try {
    if (vehicle.motHistoryJson) {
      const parsed = JSON.parse(vehicle.motHistoryJson);
      motTests = (Array.isArray(parsed) ? parsed : parsed?.motTests || []) as MotTest[];
    }
  } catch {
    motTests = [];
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#003078] to-[#1d70b8] p-4 text-white shadow-xl sm:p-6">
          <div className="flex items-center justify-between">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Garage
              </Button>
            </Link>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={refreshDvsa}
                disabled={refreshing}
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={deleteVehicle}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-col items-center text-center">
            <UkPlateDisplay registration={vehicle.registration} size="lg" />
            <h1 className="mt-3 text-xl font-bold uppercase sm:text-2xl">
              {[vehicle.make, vehicle.model].filter(Boolean).join(" ") || displayName}
            </h1>
            <p className="text-sm text-blue-100">
              {[vehicle.yearOfManufacture, vehicle.colour, vehicle.fuelType]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {vehicle.nickname && (
              <p className="mt-1 text-sm font-medium text-emerald-300">{vehicle.nickname}</p>
            )}
          </div>

          <div className="relative mx-auto mt-4 aspect-[16/7] max-w-sm overflow-hidden rounded-xl bg-white/10">
            {vehicle.photoUrl ? (
              <Image
                src={vehicle.photoUrl}
                alt={displayName}
                fill
                className="object-cover"
                unoptimized={vehicle.photoUrl.startsWith("data:")}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-white/5 via-white/10 to-emerald-400/10">
                <div className="rounded-full bg-white/15 p-4 backdrop-blur-sm">
                  <Car className="h-14 w-14 text-white/50" />
                </div>
                <p className="mt-2 text-xs font-medium text-white/50">Tap Photo to upload</p>
              </div>
            )}
            <label className="absolute bottom-2 right-2 cursor-pointer rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#003078] shadow hover:bg-white">
              <Upload className="mr-1 inline h-3 w-3" />
              Photo
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            <StatusPill label="MOT" date={vehicle.motDueDate} />
            <StatusPill label="TAX" date={vehicle.taxDueDate} />
            <StatusPill label="INS" date={vehicle.insuranceDueDate} />
            <StatusPill label="SERV" date={vehicle.nextServiceDate} />
            <StatusPill label="WARR" date={vehicle.warrantyExpiryDate} />
            <StatusPill label="BRK" date={vehicle.breakdownExpiryDate} />
          </div>
        </div>

        <div className="space-y-3">
          <StatusCard
            title={vehicle.motStatus === "VALID" ? "MOT Valid" : "MOT"}
            date={vehicle.motDueDate}
          />
          {vehicle.taxDueDate ? (
            <StatusCard
              title="Taxed"
              date={vehicle.taxDueDate}
              href="https://www.gov.uk/vehicle-tax"
            />
          ) : (
            <StatusCard
              title="Tax"
              unknown
              unknownHint="No tax date set — add below for reminders"
              onClick={() => goToSection("mot")}
            />
          )}
        </div>

        <TaxReminderPanel
          vehicleId={vehicle.id}
          currentTaxDate={vehicle.taxDueDate}
          onSaved={load}
        />

        <VehicleActionGrid
          registration={vehicle.registration}
          vehicleId={vehicle.id}
          onNavigate={goToSection}
        />

        <div id="vehicle-tabs">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex h-auto w-full flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="mot">MOT</TabsTrigger>
            <TabsTrigger value="cover">Cover</TabsTrigger>
            <TabsTrigger value="service">Service</TabsTrigger>
            <TabsTrigger value="tyres">Tyres</TabsTrigger>
            <TabsTrigger value="docs">Docs</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <StyledSection title="Vehicle details" subtitle="Nickname & mileage" icon={User}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Nickname"
                  defaultValue={vehicle.nickname || ""}
                  onBlur={(v) => v !== (vehicle.nickname || "") && patch({ nickname: v || null })}
                />
                <Field
                  label="Mileage"
                  type="number"
                  defaultValue={vehicle.mileage?.toString() || ""}
                  onBlur={(v) => patch({ mileage: v ? parseInt(v) : null })}
                />
              </div>
            </StyledSection>
          </TabsContent>

          <TabsContent value="mot" className="space-y-4">
            <StyledSection title="MOT & Tax dates" subtitle="Used for reminders" icon={Gauge} gradient="from-emerald-600 to-emerald-800">
              <div className="grid gap-4 sm:grid-cols-2">
                <DateField
                  label="MOT due"
                  dateValue={vehicle.motDueDate}
                  onSave={(d) => patch({ motDueDate: dateToIso(d) })}
                />
                <DateField
                  label="Tax due"
                  dateValue={vehicle.taxDueDate}
                  onSave={(d) => patch({ taxDueDate: dateToIso(d), taxStatus: d ? "TAXED" : null })}
                />
              </div>
            </StyledSection>
            {motTests.length > 0 && (
              <div>
                <h3 className="mb-2 font-bold">MOT history</h3>
                <MotHistoryList tests={motTests} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="cover" id="cover" className="space-y-4">
            <CoverPanel
              sectionId="section-insurance"
              title="Insurance"
              provider={vehicle.insuranceProvider}
              dateValue={vehicle.insuranceDueDate}
              notes={vehicle.insurancePolicyNotes}
              providerKey="insuranceProvider"
              dateKey="insuranceDueDate"
              notesKey="insurancePolicyNotes"
              onSave={patch}
              showNotes
            />
            <CoverPanel
              sectionId="section-warranty"
              title="Warranty"
              provider={null}
              dateValue={vehicle.warrantyExpiryDate}
              notes={vehicle.warrantyNotes}
              providerKey="warrantyProvider"
              dateKey="warrantyExpiryDate"
              notesKey="warrantyNotes"
              onSave={patch}
              hideProvider
              showNotes
            />
            <CoverPanel
              sectionId="section-breakdown"
              title="Breakdown cover"
              provider={vehicle.breakdownProvider}
              dateValue={vehicle.breakdownExpiryDate}
              notes={null}
              providerKey="breakdownProvider"
              dateKey="breakdownExpiryDate"
              notesKey="breakdownNotes"
              onSave={patch}
            />
          </TabsContent>

          <TabsContent value="service" id="service" className="space-y-4">
            <DateCard
              title="Next service due"
              dateValue={vehicle.nextServiceDate}
              onSave={(d) => patch({ nextServiceDate: dateToIso(d) })}
            />
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Log service</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={addService} className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Date</Label>
                    <Input name="serviceDate" type="date" required />
                  </div>
                  <div>
                    <Label>Garage</Label>
                    <Input name="garage" placeholder="e.g. Kwik Fit" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Description</Label>
                    <Input name="description" required placeholder="Full service" />
                  </div>
                  <div>
                    <Label>Cost (£)</Label>
                    <Input name="cost" type="number" step="0.01" />
                  </div>
                  <div>
                    <Label>Mileage</Label>
                    <Input name="mileage" type="number" />
                  </div>
                  <Button type="submit" size="sm" className="sm:col-span-2">
                    Add entry
                  </Button>
                </form>
              </CardContent>
            </Card>
            {vehicle.serviceHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {vehicle.serviceHistory.map((s) => (
                    <div key={s.id} className="border-b py-2 last:border-0">
                      <div className="flex justify-between font-medium">
                        <span>{formatDate(s.serviceDate)}</span>
                        {s.cost != null && <span>{formatCurrency(s.cost)}</span>}
                      </div>
                      <p>{s.description}</p>
                      {s.garage && (
                        <p className="text-muted-foreground">{s.garage}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tyres" id="tyres" className="space-y-4">
            <DateCard
              title="Last tyre change"
              dateValue={vehicle.tyreChangeDate}
              onSave={(d) => patch({ tyreChangeDate: dateToIso(d) })}
            />
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Log tyre change</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={addTyre} className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Date</Label>
                    <Input name="changedDate" type="date" required />
                  </div>
                  <div>
                    <Label>Brand</Label>
                    <Input name="brand" placeholder="Michelin" />
                  </div>
                  <div>
                    <Label>Tread (mm)</Label>
                    <Input name="treadDepth" type="number" step="0.1" />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Input name="notes" />
                  </div>
                  <Button type="submit" size="sm" className="sm:col-span-2">
                    Add record
                  </Button>
                </form>
              </CardContent>
            </Card>
            {vehicle.tyreRecords.length > 0 && (
              <Card>
                <CardContent className="space-y-2 pt-4 text-sm">
                  {vehicle.tyreRecords.map((t) => (
                    <div key={t.id} className="flex justify-between border-b py-2">
                      <span>{formatDate(t.changedDate)}</span>
                      <span className="text-muted-foreground">
                        {t.brand}
                        {t.treadDepth != null ? ` · ${t.treadDepth}mm` : ""}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="docs" id="docs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Upload document</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={addDocument} className="grid gap-3">
                  <div>
                    <Label>Title</Label>
                    <Input name="title" placeholder="Insurance certificate" />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <select
                      name="category"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="INSURANCE">Insurance</option>
                      <option value="MOT">MOT</option>
                      <option value="TAX">Tax</option>
                      <option value="SERVICE">Service</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <Label>File (max 500KB)</Label>
                    <Input name="file" type="file" required accept=".pdf,image/*" />
                  </div>
                  <Button type="submit" size="sm">
                    Save document
                  </Button>
                </form>
              </CardContent>
            </Card>
            {vehicle.documents.length > 0 && (
              <Card>
                <CardContent className="space-y-2 pt-4">
                  {vehicle.documents.map((d) => (
                    <a
                      key={d.id}
                      href={d.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-muted/50"
                    >
                      <span>{d.title}</span>
                      <DocCategoryBadge category={d.category} />
                    </a>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="notes">
            <Card>
              <CardContent className="pt-6">
                <Label>Notes</Label>
                <Textarea
                  className="mt-2 min-h-[120px]"
                  defaultValue={vehicle.notes || ""}
                  onBlur={(e) => {
                    if (e.target.value !== (vehicle.notes || "")) {
                      patch({ notes: e.target.value || null });
                    }
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  defaultValue,
  type = "text",
  onBlur,
}: {
  label: string;
  defaultValue: string;
  type?: string;
  onBlur: (v: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type={type}
        defaultValue={defaultValue}
        className="mt-1"
        onBlur={(e) => onBlur(e.target.value)}
      />
    </div>
  );
}

function DateCard({
  title,
  dateValue,
  onSave,
}: {
  title: string;
  dateValue: string | null;
  onSave: (d: string) => void;
}) {
  return (
    <Card>
      <CardContent className="flex items-end gap-3 pt-6">
        <div className="flex-1">
          <Label>{title}</Label>
          <Input
            type="date"
            className="mt-1"
            defaultValue={toIsoDate(dateValue)}
            onBlur={(e) => onSave(e.target.value)}
          />
        </div>
        {dateValue && (
          <p className="text-sm text-muted-foreground pb-2">
            {formatDate(dateValue)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function DateField({
  label,
  dateValue,
  onSave,
}: {
  label: string;
  dateValue: string | null;
  onSave: (d: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type="date"
        className="mt-1"
        defaultValue={toIsoDate(dateValue)}
        onBlur={(e) => onSave(e.target.value)}
      />
    </div>
  );
}

function CoverPanel({
  sectionId,
  title,
  provider,
  dateValue,
  notes,
  providerKey,
  dateKey,
  notesKey,
  onSave,
  hideProvider,
  showNotes,
}: {
  sectionId?: string;
  title: string;
  provider: string | null;
  dateValue: string | null;
  notes: string | null;
  providerKey: string;
  dateKey: string;
  notesKey: string;
  onSave: (f: Record<string, unknown>) => void;
  hideProvider?: boolean;
  showNotes?: boolean;
}) {
  return (
    <Card id={sectionId} className={sectionId ? "scroll-mt-section" : undefined}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {!hideProvider && (
          <div>
            <Label>Provider</Label>
            <Input
              className="mt-1"
              defaultValue={provider || ""}
              onBlur={(e) => onSave({ [providerKey]: e.target.value || null })}
            />
          </div>
        )}
        <div>
          <Label>Expiry / renewal date</Label>
          <Input
            type="date"
            className="mt-1"
            defaultValue={toIsoDate(dateValue)}
            onBlur={(e) =>
              onSave({ [dateKey]: dateToIso(e.target.value) })
            }
          />
        </div>
        {showNotes ? (
          <div>
            <Label>Notes</Label>
            <Textarea
              className="mt-1"
              defaultValue={notes || ""}
              onBlur={(e) => onSave({ [notesKey]: e.target.value || null })}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function DocCategoryBadge({ category }: { category: string }) {
  return (
    <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
      {category}
    </span>
  );
}
