"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlateLookupHero } from "@/components/plate-lookup-hero";
import { isValidReg, sanitiseReg } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface VehicleLookupFormProps {
  compact?: boolean;
}

export function VehicleLookupForm({ compact }: VehicleLookupFormProps) {
  const [registration, setRegistration] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = sanitiseReg(registration);
    if (!cleaned) {
      toast({ title: "Enter a registration", variant: "destructive" });
      return;
    }
    if (!isValidReg(cleaned)) {
      toast({
        title: "Invalid registration",
        description: "Please enter a valid UK vehicle registration number.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    router.push(`/lookup/${encodeURIComponent(cleaned)}`);
  }

  return (
    <PlateLookupHero
      registration={registration}
      onRegistrationChange={setRegistration}
      onSubmit={handleSubmit}
      loading={loading}
      compact={compact}
    />
  );
}
