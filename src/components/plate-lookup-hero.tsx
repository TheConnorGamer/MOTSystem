"use client";

import { Search, Loader2, ShieldCheck } from "lucide-react";
import { UkPlateInput } from "@/components/uk-plate-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PlateLookupHeroProps {
  registration: string;
  onRegistrationChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading?: boolean;
  className?: string;
  compact?: boolean;
}

export function PlateLookupHero({
  registration,
  onRegistrationChange,
  onSubmit,
  loading,
  className,
  compact,
}: PlateLookupHeroProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#003078] via-[#1d70b8] to-[#00703c] p-6 text-white shadow-xl sm:p-10",
        className
      )}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />

      <div className="relative mx-auto max-w-md text-center">
        {!compact && (
          <>
            <div className="mb-1 flex items-center justify-center gap-2">
              <ShieldCheck className="h-6 w-6 text-emerald-300" />
              <span className="text-2xl font-bold tracking-tight sm:text-3xl">
                Vehicle<span className="text-emerald-300">Guard</span>
              </span>
            </div>
            <p className="mb-1 text-sm font-medium text-blue-100">
              Car Check · DVSA Powered
            </p>
            <p className="mb-6 text-xs uppercase tracking-[0.25em] text-white/60">
              — Free Garage —
            </p>
          </>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <UkPlateInput
            value={registration}
            onChange={onRegistrationChange}
            disabled={loading}
            size="lg"
          />
          <Button
            type="submit"
            size="lg"
            disabled={loading || !registration.trim()}
            className="h-14 w-full rounded-full bg-white text-base font-bold text-[#003078] shadow-lg hover:bg-blue-50 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Search className="mr-2 h-5 w-5" />
            )}
            Search Vehicle
          </Button>
        </form>

        {!compact && (
          <p className="mt-4 text-xs text-white/70">
            Instant MOT history · Tax reminders · Your personal garage
          </p>
        )}
      </div>
    </div>
  );
}
