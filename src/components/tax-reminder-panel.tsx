"use client";

import { useState } from "react";
import { Crown, ExternalLink, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface TaxReminderPanelProps {
  vehicleId?: string;
  currentTaxDate?: string | null;
  onSaved?: () => void;
  requireSaveMessage?: string;
}

export function TaxReminderPanel({
  vehicleId,
  currentTaxDate,
  onSaved,
  requireSaveMessage,
}: TaxReminderPanelProps) {
  const { toast } = useToast();
  const [date, setDate] = useState(
    currentTaxDate ? new Date(currentTaxDate).toISOString().slice(0, 10) : ""
  );
  const [saving, setSaving] = useState(false);

  async function saveTaxDate() {
    if (!vehicleId) return;
    if (!date) {
      toast({ title: "Pick a tax due date", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taxDueDate: new Date(date + "T12:00:00").toISOString(),
          taxStatus: "TAXED",
        }),
      });
      if (res.ok) {
        toast({ title: "Tax reminder set" });
        onSaved?.();
      } else {
        toast({ title: "Failed to save", variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm dark:from-amber-950/20 dark:to-orange-950/10">
      <div className="flex items-center gap-2 border-b border-amber-200/60 bg-gradient-to-r from-zinc-700 to-zinc-900 px-4 py-3 text-white">
        <Crown className="h-5 w-5" />
        <div>
          <p className="font-bold">Vehicle tax</p>
          <p className="text-xs text-white/75">DVSA doesn&apos;t include tax — add it yourself</p>
        </div>
      </div>
      <div className="space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          Check status on GOV.UK, then add your renewal date here for reminders.
        </p>
        <a
          href="https://www.gov.uk/check-vehicle-tax"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex"
        >
          <Button variant="outline" size="sm" className="gap-2">
            Check on GOV.UK
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </a>

        {vehicleId ? (
          <div className="rounded-xl border bg-white/80 p-4 dark:bg-card">
            <Label htmlFor="tax-due" className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Tax due date
            </Label>
            <div className="mt-2 flex gap-2">
              <Input
                id="tax-due"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <Button onClick={saveTaxDate} disabled={saving}>
                {saving ? "Saving…" : "Set reminder"}
              </Button>
            </div>
          </div>
        ) : (
          <p className="rounded-lg bg-white/60 px-3 py-2 text-sm font-medium dark:bg-black/20">
            {requireSaveMessage || "Save this vehicle to your garage to track tax reminders."}
          </p>
        )}
      </div>
    </div>
  );
}
