"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PenLine } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PlateLookupHero } from "@/components/plate-lookup-hero";
import { ManualVehicleEntry } from "@/components/manual-vehicle-entry";
import { isValidReg, sanitiseReg } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function AddVehiclePage() {
  const [registration, setRegistration] = useState("");
  const [loading, setLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = sanitiseReg(registration);
    if (!cleaned) {
      toast({ title: "Enter a registration", variant: "destructive" });
      return;
    }
    if (!isValidReg(cleaned)) {
      toast({
        title: "Invalid registration",
        description: "Please enter a valid UK plate number.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    router.push(`/lookup/${encodeURIComponent(cleaned)}`);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-lg space-y-6">
        <PlateLookupHero
          registration={registration}
          onRegistrationChange={setRegistration}
          onSubmit={handleLookup}
          loading={loading}
        />

        <button
          type="button"
          onClick={() => setShowManual((v) => !v)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/50 hover:text-foreground"
        >
          <PenLine className="h-4 w-4" />
          {showManual ? "Hide manual entry" : "Can't find it? Add manually"}
        </button>

        {showManual && (
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <ManualVehicleEntry embedded />
          </div>
        )}
      </div>
    </AppShell>
  );
}
