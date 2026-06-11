"use client";

import {
  Calendar,
  Crown,
  Shield,
  Wrench,
  PoundSterling,
  Truck,
  Circle,
  BadgeCheck,
  FileText,
} from "lucide-react";
import { ActionTile } from "@/components/action-tile";
import { useToast } from "@/hooks/use-toast";

interface VehicleActionGridProps {
  registration: string;
  vehicleId?: string;
  onNavigate?: (tab: string, section?: string) => void;
}

export function VehicleActionGrid({
  registration,
  vehicleId,
  onNavigate,
}: VehicleActionGridProps) {
  const { toast } = useToast();

  function requireGarage(tab: string, section?: string) {
    if (vehicleId && onNavigate) {
      onNavigate(tab, section);
      return;
    }
    toast({
      title: "Save to garage first",
      description: "Add this vehicle to your garage to track insurance, service, and more.",
    });
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <ActionTile
        href="https://www.gov.uk/booking-an-mot-test"
        icon={Calendar}
        label="Book MOT"
        sublabel="Official GOV.UK"
        tag="GOV.UK"
        color="blue"
        external
      />
      <ActionTile
        href="https://www.gov.uk/vehicle-tax"
        icon={Crown}
        label="Tax / SORN"
        sublabel="Renew or declare SORN"
        tag="GOV.UK"
        color="black"
        external
      />
      <ActionTile
        onClick={() => requireGarage("cover", "section-insurance")}
        icon={Shield}
        label="Insurance"
        sublabel="Set renewal reminder"
        tag="In app"
        color="navy"
      />
      <ActionTile
        onClick={() => requireGarage("service")}
        icon={Wrench}
        label="Log Service"
        sublabel="Track dates & history"
        tag="In app"
        color="blue"
      />
      <ActionTile
        href={`/lookup/${registration}`}
        icon={PoundSterling}
        label="MOT Report"
        sublabel="Full DVSA history"
        tag="DVSA"
        color="yellow"
      />
      <ActionTile
        onClick={() => requireGarage("cover", "section-breakdown")}
        icon={Truck}
        label="Breakdown"
        sublabel="Cover expiry date"
        tag="In app"
        color="orange"
      />
      <ActionTile
        onClick={() => requireGarage("tyres")}
        icon={Circle}
        label="Tyres"
        sublabel="Log changes"
        tag="In app"
        color="teal"
      />
      <ActionTile
        onClick={() => requireGarage("cover", "section-warranty")}
        icon={BadgeCheck}
        label="Warranty"
        sublabel="Expiry reminder"
        tag="In app"
        color="green"
      />
      <ActionTile
        onClick={() => requireGarage("docs")}
        icon={FileText}
        label="Documents"
        sublabel="Upload PDFs & photos"
        tag="In app"
        color="purple"
      />
    </div>
  );
}
