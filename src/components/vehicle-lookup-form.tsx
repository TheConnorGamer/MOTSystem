"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isValidReg } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function VehicleLookupForm() {
  const [registration, setRegistration] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const cleaned = registration.trim().toUpperCase();
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Input
          placeholder="Enter reg (e.g. AB12 CDE)"
          value={registration}
          onChange={(e) => setRegistration(e.target.value.toUpperCase())}
          className="h-12 text-lg uppercase tracking-wide"
          maxLength={8}
          disabled={loading}
          aria-label="Vehicle registration number"
        />
      </div>
      <Button type="submit" size="lg" disabled={loading} className="h-12 px-6">
        {loading ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <Search className="mr-2 h-5 w-5" />
        )}
        Check Vehicle
      </Button>
    </form>
  );
}
