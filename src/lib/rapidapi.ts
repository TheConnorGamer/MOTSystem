/**
 * RapidAPI UK Vehicle Data Integration
 * Fallback provider when DVSA MOT History API returns nothing.
 *
 * Actual response structure:
 * {
 *   vehicle: { vrm, make, model, fuel, colour, engine_size, mileage, year, type, registered, emissions },
 *   tax: { status, message, valid, sorn, expires, cost_per_six_months, cost_per_twelve_months, ved_band },
 *   mot: { status, expiryDate? }
 * }
 */

import { VehicleLookupResult } from "@/types";

interface RapidApiVehicleResponse {
  vehicle: {
    vrm: string;
    make: string;
    model: string;
    fuel: string;
    colour: string;
    engine_size: string;
    mileage: string;
    year: string;
    type: string;
    registered: string;
    emissions: string;
  };
  tax: {
    status: string;
    message: string;
    valid: boolean;
    sorn: boolean;
    expires: string;
    cost_per_six_months: string;
    cost_per_twelve_months: string;
    ved_band: string;
  };
  mot: {
    status: string;
    expiryDate?: string;
  };
}

function parseYear(yearStr: string): number | undefined {
  const match = yearStr.match(/(\d{4})/);
  return match ? parseInt(match[1]) : undefined;
}

function parseMileage(mileageStr: string): number | undefined {
  const cleaned = mileageStr.replace(/,/g, "").replace(/\s*miles.*$/i, "").trim();
  const num = parseInt(cleaned);
  return isNaN(num) ? undefined : num;
}

function parseDate(dateStr: string): Date | undefined {
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? undefined : d;
  } catch {
    return undefined;
  }
}

export async function lookupVehicleRapidApi(registration: string): Promise<VehicleLookupResult | null> {
  const apiKey = process.env.RAPIDAPI_KEY;
  const enabled = process.env.RAPIDAPI_ENABLED !== "false";
  if (!enabled || !apiKey) {
    console.log("[RAPIDAPI] Disabled or no API key configured");
    return null;
  }

  const host =
    process.env.RAPIDAPI_HOST || "uk-vehicle-data1.p.rapidapi.com";
  const path =
    process.env.RAPIDAPI_PATH ||
    "/cartax.api.v1.Public/GetInitialReport";
  const cleanReg = registration.replace(/\s/g, "").toUpperCase();
  console.log(`[RAPIDAPI] Looking up: ${cleanReg} via ${host}`);

  try {
    const response = await fetch(`https://${host}${path}`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": host,
      },
      body: JSON.stringify({ vrm: cleanReg }),
    });

    console.log(`[RAPIDAPI] Response status: ${response.status}`);

    if (response.status === 404) {
      console.log(`[RAPIDAPI] 404 - vehicle not found`);
      return null;
    }

    const responseText = await response.text();

    if (!response.ok) {
      if (response.status === 403) {
        console.error(
          `[RAPIDAPI] Not subscribed to ${host}. Subscribe on RapidAPI or set RAPIDAPI_ENABLED=false`
        );
      } else {
        console.error(`[RAPIDAPI] HTTP error ${response.status}:`, responseText);
      }
      return null;
    }

    console.log(`[RAPIDAPI] Response:`, responseText.slice(0, 800));

    const data: RapidApiVehicleResponse = JSON.parse(responseText);

    if (!data.vehicle) {
      console.log("[RAPIDAPI] No vehicle data in response");
      return null;
    }

    const year = parseYear(data.vehicle.year);
    const motDueDate = data.mot?.expiryDate ? parseDate(data.mot.expiryDate) : undefined;
    const taxDueDate = data.tax?.expires ? parseDate(data.tax.expires) : undefined;

    // Parse last MOT date from mileage string (e.g. "152,961 miles on 06 Jul 2022")
    let lastMotDate: Date | undefined;
    const mileageMatch = data.vehicle.mileage?.match(/on\s+(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})/);
    if (mileageMatch) {
      lastMotDate = parseDate(mileageMatch[1]);
    }

    // Basic valuation based on age
    let estimatedValue: number | undefined;
    if (year) {
      const age = new Date().getFullYear() - year;
      if (age <= 1) estimatedValue = 25000;
      else if (age <= 3) estimatedValue = 18000;
      else if (age <= 5) estimatedValue = 12000;
      else if (age <= 10) estimatedValue = 7000;
      else if (age <= 15) estimatedValue = 3500;
      else estimatedValue = 1500;
    }

    const motStatusStr = data.mot?.status?.toLowerCase() || "";
    const taxStatusStr = data.tax?.status?.toLowerCase() || "";

    return {
      registration: cleanReg,
      make: data.vehicle.make,
      model: data.vehicle.model,
      colour: data.vehicle.colour,
      fuelType: data.vehicle.fuel,
      yearOfManufacture: year,
      motDueDate,
      taxDueDate,
      motStatus: motStatusStr === "pass" || motStatusStr === "valid" ? "VALID" : "EXPIRED",
      taxStatus: taxStatusStr === "pass" || data.tax?.valid ? "TAXED" : data.tax?.sorn ? "SORN" : "UNTAXED",
      motHistory: [],
      mileageHistory: [],
      lastMotDate,
      lastMotMileage: parseMileage(data.vehicle.mileage),
      advisoryCount: 0,
      failureCount: 0,
      commonFailures: [],
      mileageAnomaly: false,
      estimatedValue,
    };
  } catch (error) {
    console.error("[RAPIDAPI] Lookup failed:", error);
    return null;
  }
}
