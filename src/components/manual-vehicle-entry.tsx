"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Car } from "lucide-react";

interface ManualVehicleEntryProps {
  registration: string;
}

export function ManualVehicleEntry({ registration }: ManualVehicleEntryProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    make: "",
    model: "",
    colour: "",
    fuelType: "",
    yearOfManufacture: "",
    motDueDate: "",
    taxDueDate: "",
  });

  async function handleSave() {
    if (!session?.user) {
      toast({ title: "Please sign in to save vehicles", variant: "destructive" });
      return;
    }

    if (!form.make || !form.model) {
      toast({ title: "Make and model are required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registration,
          make: form.make,
          model: form.model,
          colour: form.colour || undefined,
          fuelType: form.fuelType || undefined,
          yearOfManufacture: form.yearOfManufacture ? parseInt(form.yearOfManufacture) : undefined,
          motDueDate: form.motDueDate || undefined,
          taxDueDate: form.taxDueDate || undefined,
          motStatus: form.motDueDate ? "VALID" : "NO_TESTS",
          taxStatus: form.taxDueDate ? "TAXED" : "UNKNOWN",
        }),
      });

      if (response.ok) {
        toast({ title: "Vehicle saved to your garage" });
        router.push("/dashboard");
      } else {
        const err = await response.json();
        toast({ title: "Failed to save", description: err.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-lg mx-auto mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Car className="h-5 w-5" />
          Add Vehicle Manually
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          The DVSA API did not return data for this vehicle. You can add it manually and set reminder dates.
          Find MOT and tax dates on{" "}
          <a
            href={`https://www.gov.uk/check-vehicle-tax`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            GOV.UK
          </a>
          .
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="make">Make *</Label>
            <Input
              id="make"
              placeholder="e.g. Ford"
              value={form.make}
              onChange={(e) => setForm((f) => ({ ...f, make: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="model">Model *</Label>
            <Input
              id="model"
              placeholder="e.g. Fiesta"
              value={form.model}
              onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="colour">Colour</Label>
            <Input
              id="colour"
              placeholder="e.g. Blue"
              value={form.colour}
              onChange={(e) => setForm((f) => ({ ...f, colour: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="fuelType">Fuel Type</Label>
            <select
              id="fuelType"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={form.fuelType}
              onChange={(e) => setForm((f) => ({ ...f, fuelType: e.target.value }))}
            >
              <option value="">Select...</option>
              <option value="PETROL">Petrol</option>
              <option value="DIESEL">Diesel</option>
              <option value="ELECTRIC">Electric</option>
              <option value="HYBRID">Hybrid</option>
              <option value="PLUGIN_HYBRID">Plug-in Hybrid</option>
              <option value="LPG">LPG</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="year">Year of Manufacture</Label>
          <Input
            id="year"
            type="number"
            placeholder="e.g. 2019"
            value={form.yearOfManufacture}
            onChange={(e) => setForm((f) => ({ ...f, yearOfManufacture: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="motDueDate">MOT Due Date</Label>
            <Input
              id="motDueDate"
              type="date"
              value={form.motDueDate}
              onChange={(e) => setForm((f) => ({ ...f, motDueDate: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="taxDueDate">Tax Due Date</Label>
            <Input
              id="taxDueDate"
              type="date"
              value={form.taxDueDate}
              onChange={(e) => setForm((f) => ({ ...f, taxDueDate: e.target.value }))}
            />
          </div>
        </div>

        <Button className="w-full" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save to My Garage
        </Button>
      </CardContent>
    </Card>
  );
}
