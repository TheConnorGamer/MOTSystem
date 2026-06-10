/**
 * Service Estimation Engine
 *
 * Calculates next service dates based on manufacturer intervals,
 * current mileage, and MOT advisory history.
 */

import { prisma } from "./prisma";
import { ServiceEstimate } from "@/types";

// Popular manufacturer service intervals
const DEFAULT_INTERVAL_MILES = 12000;
const DEFAULT_INTERVAL_MONTHS = 12;

const MANUFACTURER_INTERVALS: Record<string, { miles: number; months: number }> = {
  // European
  audi: { miles: 19000, months: 24 },
  bmw: { miles: 18000, months: 24 },
  mercedes: { miles: 15500, months: 12 },
  volkswagen: { miles: 10000, months: 12 },
  seat: { miles: 10000, months: 12 },
  skoda: { miles: 10000, months: 12 },
  // British
  ford: { miles: 12500, months: 12 },
  vauxhall: { miles: 20000, months: 12 },
  // Japanese
  toyota: { miles: 10000, months: 12 },
  honda: { miles: 12500, months: 12 },
  nissan: { miles: 9000, months: 12 },
  mazda: { miles: 12500, months: 12 },
  // Korean
  hyundai: { miles: 10000, months: 12 },
  kia: { miles: 10000, months: 12 },
  // French
  peugeot: { miles: 16000, months: 12 },
  citroen: { miles: 12500, months: 12 },
  renault: { miles: 18000, months: 12 },
};

export function getManufacturerInterval(make?: string | null): {
  miles: number;
  months: number;
} {
  if (!make) return { miles: DEFAULT_INTERVAL_MILES, months: DEFAULT_INTERVAL_MONTHS };
  const key = make.toLowerCase().trim();
  return MANUFACTURER_INTERVALS[key] || {
    miles: DEFAULT_INTERVAL_MILES,
    months: DEFAULT_INTERVAL_MONTHS,
  };
}

export async function getServiceIntervalFromDb(
  make?: string | null,
  model?: string | null
): Promise<{ miles: number; months: number }> {
  if (!make || !model) return getManufacturerInterval(make);

  const interval = await prisma.serviceInterval.findFirst({
    where: {
      make: { equals: make, mode: "insensitive" },
      model: { equals: model, mode: "insensitive" },
    },
    orderBy: { createdAt: "desc" },
  });

  if (interval) {
    return {
      miles: interval.intervalMiles,
      months: interval.intervalMonths,
    };
  }

  return getManufacturerInterval(make);
}

export function calculateNextService(
  lastServiceDate: Date | null | undefined,
  lastServiceMileage: number | null | undefined,
  currentMileage: number | null | undefined,
  make?: string | null,
  model?: string | null
): ServiceEstimate {
  const interval = getManufacturerInterval(make);

  // If no last service info, recommend immediate service
  if (!lastServiceDate) {
    return {
      nextServiceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      nextServiceMileage: (currentMileage || 0) + interval.miles,
      serviceItems: ["Full inspection recommended", "Oil and filter change", "Brake check"],
      urgency: "high",
    };
  }

  const nextDate = new Date(lastServiceDate);
  nextDate.setMonth(nextDate.getMonth() + interval.months);

  const nextMileage = (lastServiceMileage || 0) + interval.miles;

  // Determine urgency
  const now = new Date();
  const daysUntilService = Math.ceil(
    (nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  const milesUntilService = nextMileage - (currentMileage || 0);

  let urgency: "low" | "medium" | "high" = "low";
  if (daysUntilService < 0 || milesUntilService < 0) urgency = "high";
  else if (daysUntilService <= 30 || milesUntilService <= 1000) urgency = "medium";

  // Smart service items based on typical intervals
  const serviceItems: string[] = [];
  if (interval.months >= 12) {
    serviceItems.push("Full service / annual inspection");
  } else {
    serviceItems.push("Interim service");
  }

  serviceItems.push("Engine oil and filter replacement");

  if (interval.months >= 12) {
    serviceItems.push("Air filter check / replacement");
    serviceItems.push("Cabin / pollen filter replacement");
    serviceItems.push("Brake pad and disc inspection");
    serviceItems.push("Tyre condition and pressure check");
    serviceItems.push("Battery health check");
  }

  if (milesUntilService < 0) {
    serviceItems.unshift("OVERDUE: Schedule service immediately");
  }

  return {
    nextServiceDate: nextDate,
    nextServiceMileage: nextMileage,
    serviceItems,
    urgency,
  };
}

export function getAdvisoryServiceItems(advisories: string[]): string[] {
  const items: string[] = [];
  const advisoryText = advisories.join(" ").toLowerCase();

  if (advisoryText.includes("brake")) items.push("Brake system inspection");
  if (advisoryText.includes("tyre") || advisoryText.includes("tread")) items.push("Tyre replacement / inspection");
  if (advisoryText.includes("suspension")) items.push("Suspension component check");
  if (advisoryText.includes("exhaust")) items.push("Exhaust system inspection");
  if (advisoryText.includes("light") || advisoryText.includes("lamp")) items.push("Lighting system check");
  if (advisoryText.includes("wiper") || advisoryText.includes("washer")) items.push("Wiper blade / washer fluid service");
  if (advisoryText.includes("oil")) items.push("Oil level / leak inspection");
  if (advisoryText.includes("corrosion")) items.push("Bodywork / rust treatment");
  if (advisoryText.includes("drive belt")) items.push("Auxiliary drive belt replacement");

  return items;
}
