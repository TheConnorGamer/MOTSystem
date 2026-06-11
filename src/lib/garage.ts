import { daysUntil } from "@/lib/utils";

export type UrgencyLevel = "overdue" | "urgent" | "soon" | "ok" | "unknown";

export interface GarageVehicle {
  id: string;
  registration: string;
  nickname?: string | null;
  make?: string | null;
  model?: string | null;
  yearOfManufacture?: number | null;
  colour?: string | null;
  photoUrl?: string | null;
  motDueDate?: string | Date | null;
  taxDueDate?: string | Date | null;
  nextServiceDate?: string | Date | null;
  insuranceDueDate?: string | Date | null;
  warrantyExpiryDate?: string | Date | null;
  breakdownExpiryDate?: string | Date | null;
  motStatus?: string | null;
  taxStatus?: string | null;
  motHistoryJson?: string | null;
  mileage?: number | null;
  notes?: string | null;
}

export type GarageFilter = "all" | "attention" | "mot" | "tax" | "service";
export type GarageSort = "urgency" | "name" | "added";

export function getUrgencyLevel(days: number | null): UrgencyLevel {
  if (days === null) return "unknown";
  if (days < 0) return "overdue";
  if (days <= 7) return "urgent";
  if (days <= 30) return "soon";
  return "ok";
}

export function getWorstUrgency(vehicle: GarageVehicle): UrgencyLevel {
  const dates = [
    vehicle.motDueDate,
    vehicle.taxDueDate,
    vehicle.nextServiceDate,
    vehicle.insuranceDueDate,
    vehicle.warrantyExpiryDate,
    vehicle.breakdownExpiryDate,
  ];
  const levels = dates.map((d) => getUrgencyLevel(daysUntil(d)));
  if (levels.includes("overdue")) return "overdue";
  if (levels.includes("urgent")) return "urgent";
  if (levels.includes("soon")) return "soon";
  if (levels.includes("ok")) return "ok";
  return "unknown";
}

export function urgencyScore(level: UrgencyLevel): number {
  switch (level) {
    case "overdue":
      return 0;
    case "urgent":
      return 1;
    case "soon":
      return 2;
    case "ok":
      return 3;
    default:
      return 4;
  }
}

export function getSoonestDays(vehicle: GarageVehicle): number | null {
  const allDays = [
    daysUntil(vehicle.motDueDate),
    daysUntil(vehicle.taxDueDate),
    daysUntil(vehicle.nextServiceDate),
    daysUntil(vehicle.insuranceDueDate),
    daysUntil(vehicle.warrantyExpiryDate),
    daysUntil(vehicle.breakdownExpiryDate),
  ].filter((d): d is number => d !== null);

  if (allDays.length === 0) return null;
  return Math.min(...allDays);
}

export function needsAttention(vehicle: GarageVehicle): boolean {
  const level = getWorstUrgency(vehicle);
  return level === "overdue" || level === "urgent" || level === "soon";
}

export function filterVehicles(
  vehicles: GarageVehicle[],
  filter: GarageFilter,
  search: string
): GarageVehicle[] {
  const q = search.trim().toLowerCase();
  return vehicles.filter((v) => {
    const matchesSearch =
      !q ||
      v.registration.toLowerCase().includes(q.replace(/\s/g, "")) ||
      (v.nickname?.toLowerCase().includes(q) ?? false) ||
      (v.make?.toLowerCase().includes(q) ?? false) ||
      (v.model?.toLowerCase().includes(q) ?? false);

    if (!matchesSearch) return false;

    switch (filter) {
      case "attention":
        return needsAttention(v);
      case "mot":
        return v.motDueDate != null;
      case "tax":
        return v.taxDueDate != null;
      case "service":
        return v.nextServiceDate != null;
      default:
        return true;
    }
  });
}

export function sortVehicles(
  vehicles: GarageVehicle[],
  sort: GarageSort
): GarageVehicle[] {
  const copy = [...vehicles];
  switch (sort) {
    case "name":
      return copy.sort((a, b) =>
        (a.nickname || a.registration).localeCompare(
          b.nickname || b.registration
        )
      );
    case "added":
      return copy;
    case "urgency":
    default:
      return copy.sort((a, b) => {
        const scoreA = urgencyScore(getWorstUrgency(a));
        const scoreB = urgencyScore(getWorstUrgency(b));
        if (scoreA !== scoreB) return scoreA - scoreB;
        const daysA = getSoonestDays(a) ?? 9999;
        const daysB = getSoonestDays(b) ?? 9999;
        return daysA - daysB;
      });
  }
}
