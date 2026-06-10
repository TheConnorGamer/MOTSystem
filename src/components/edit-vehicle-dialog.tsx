"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Vehicle {
  id: string;
  registration: string;
  make: string | null;
  model: string | null;
  taxDueDate: string | null;
  taxStatus: string | null;
  motDueDate: string | null;
  nextServiceDate: string | null;
  lastServiceDate: string | null;
  serviceIntervalMiles: number | null;
  serviceIntervalMonths: number | null;
  insuranceDueDate: string | null;
  notes: string | null;
  mileage: number | null;
}

export function EditVehicleDialog({
  vehicle,
  onUpdated,
}: {
  vehicle: Vehicle;
  onUpdated: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    taxDueDate: vehicle.taxDueDate ? new Date(vehicle.taxDueDate).toISOString().split("T")[0] : "",
    taxStatus: vehicle.taxStatus || "UNKNOWN",
    motDueDate: vehicle.motDueDate ? new Date(vehicle.motDueDate).toISOString().split("T")[0] : "",
    nextServiceDate: vehicle.nextServiceDate
      ? new Date(vehicle.nextServiceDate).toISOString().split("T")[0]
      : "",
    lastServiceDate: vehicle.lastServiceDate
      ? new Date(vehicle.lastServiceDate).toISOString().split("T")[0]
      : "",
    serviceIntervalMiles: vehicle.serviceIntervalMiles?.toString() || "",
    serviceIntervalMonths: vehicle.serviceIntervalMonths?.toString() || "",
    insuranceDueDate: vehicle.insuranceDueDate
      ? new Date(vehicle.insuranceDueDate).toISOString().split("T")[0]
      : "",
    notes: vehicle.notes || "",
    mileage: vehicle.mileage?.toString() || "",
  });

  async function handleSave() {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      if (form.taxDueDate) payload.taxDueDate = new Date(form.taxDueDate).toISOString();
      else payload.taxDueDate = null;
      if (form.taxStatus) payload.taxStatus = form.taxStatus;
      if (form.motDueDate) payload.motDueDate = new Date(form.motDueDate).toISOString();
      else payload.motDueDate = null;
      if (form.nextServiceDate) payload.nextServiceDate = new Date(form.nextServiceDate).toISOString();
      else payload.nextServiceDate = null;
      if (form.lastServiceDate) payload.lastServiceDate = new Date(form.lastServiceDate).toISOString();
      else payload.lastServiceDate = null;
      if (form.serviceIntervalMiles) payload.serviceIntervalMiles = parseInt(form.serviceIntervalMiles);
      else payload.serviceIntervalMiles = null;
      if (form.serviceIntervalMonths) payload.serviceIntervalMonths = parseInt(form.serviceIntervalMonths);
      else payload.serviceIntervalMonths = null;
      if (form.insuranceDueDate) payload.insuranceDueDate = new Date(form.insuranceDueDate).toISOString();
      else payload.insuranceDueDate = null;
      payload.notes = form.notes || null;
      if (form.mileage) payload.mileage = parseInt(form.mileage);
      else payload.mileage = null;

      const res = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({ title: "Vehicle updated" });
        setOpen(false);
        onUpdated();
      } else {
        toast({ title: "Failed to update", variant: "destructive" });
      }
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {vehicle.registration}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="motDue">MOT Due Date</Label>
              <Input
                id="motDue"
                type="date"
                value={form.motDueDate}
                onChange={(e) => setForm((f) => ({ ...f, motDueDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxDue">Tax Due Date</Label>
              <Input
                id="taxDue"
                type="date"
                value={form.taxDueDate}
                onChange={(e) => setForm((f) => ({ ...f, taxDueDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxStatus">Tax Status</Label>
            <select
              id="taxStatus"
              value={form.taxStatus}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm((f) => ({ ...f, taxStatus: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="TAXED">Taxed</option>
              <option value="SORN">SORN</option>
              <option value="UNTAXED">Untaxed</option>
              <option value="UNKNOWN">Unknown</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nextService">Next Service</Label>
              <Input
                id="nextService"
                type="date"
                value={form.nextServiceDate}
                onChange={(e) => setForm((f) => ({ ...f, nextServiceDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastService">Last Service</Label>
              <Input
                id="lastService"
                type="date"
                value={form.lastServiceDate}
                onChange={(e) => setForm((f) => ({ ...f, lastServiceDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="svcMiles">Service Interval (miles)</Label>
              <Input
                id="svcMiles"
                type="number"
                value={form.serviceIntervalMiles}
                onChange={(e) => setForm((f) => ({ ...f, serviceIntervalMiles: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="svcMonths">Service Interval (months)</Label>
              <Input
                id="svcMonths"
                type="number"
                value={form.serviceIntervalMonths}
                onChange={(e) => setForm((f) => ({ ...f, serviceIntervalMonths: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="insurance">Insurance Due</Label>
              <Input
                id="insurance"
                type="date"
                value={form.insuranceDueDate}
                onChange={(e) => setForm((f) => ({ ...f, insuranceDueDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mileage">Current Mileage</Label>
              <Input
                id="mileage"
                type="number"
                value={form.mileage}
                onChange={(e) => setForm((f) => ({ ...f, mileage: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              value={form.notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="e.g. New tyres fitted 2025, timing belt done..."
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
