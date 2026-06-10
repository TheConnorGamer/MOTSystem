/**
 * RegCheck.org.uk UK Vehicle Lookup API
 * Direct provider — NOT on RapidAPI, so no billing sync issues.
 * £0.15 per lookup, 10 free credits on signup.
 * Returns: make, model, colour, fuel, engine size, year, VIN, body style, doors, seats, etc.
 * Does NOT return MOT/tax due dates.
 */

import { VehicleLookupResult } from "@/types";

interface RegCheckResponse {
  Description?: string;
  RegistrationYear?: string;
  CarMake?: { CurrentTextValue?: string };
  CarModel?: { CurrentTextValue?: string };
  EngineSize?: { CurrentTextValue?: string };
  FuelType?: { CurrentTextValue?: string };
  Colour?: string;
  BodyStyle?: { CurrentTextValue?: string };
  Doors?: string;
  VechileIdentificationNumber?: string;
  NumberOfSeats?: string;
  VehicleInsuranceGroup?: string;
  IndicativeValue?: { CurrentTextValue?: string };
  TowWeight?: string;
  GrossWeight?: string;
}

function extractMakeModel(desc: string): { make: string; model: string } {
  // Description is usually like "BMW 3 Series 320d SE 4dr"
  const parts = desc.split(" ");
  if (parts.length >= 2) {
    return {
      make: parts[0],
      model: parts.slice(1).join(" "),
    };
  }
  return { make: desc, model: "" };
}

function mapFuelType(fuel: string): string {
  const f = fuel?.toUpperCase() || "";
  if (f.includes("PETROL") || f.includes("GASOLINE")) return "PETROL";
  if (f.includes("DIESEL")) return "DIESEL";
  if (f.includes("ELECTRIC")) return "ELECTRIC";
  if (f.includes("HYBRID")) return "HYBRID";
  if (f.includes("LPG") || f.includes("GPL")) return "LPG";
  return "OTHER";
}

export async function lookupVehicleRegCheck(registration: string): Promise<VehicleLookupResult | null> {
  const enabled = process.env.REGCHECK_ENABLED === "true";
  const username = process.env.REGCHECK_USERNAME;
  if (!enabled || !username) {
    console.log("[REGCHECK] Disabled or no username configured");
    return null;
  }

  const cleanReg = registration.replace(/\s/g, "").toUpperCase();
  console.log(`[REGCHECK] Looking up: ${cleanReg}`);

  const xmlExtract = (text: string, tag: string): string | undefined => {
    const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`, "i");
    const match = text.match(regex);
    return match ? match[1].trim() : undefined;
  };

  const xmlExtractNested = (text: string, parent: string, child: string): string | undefined => {
    const parentMatch = text.match(new RegExp(`<${parent}>[\\s\\S]*?</${parent}>`, "i"));
    if (!parentMatch) return undefined;
    const childMatch = parentMatch[0].match(new RegExp(`<${child}>([^<]*)</${child}>`, "i"));
    return childMatch ? childMatch[1].trim() : undefined;
  };

  const parseVehiclePayload = (responseText: string): RegCheckResponse | null => {
    const jsonMatch = responseText.match(/<vehicleJson>([\s\S]*?)<\/vehicleJson>/i);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim()) as RegCheckResponse;
      } catch {
        console.log("[REGCHECK] Failed to parse vehicleJson payload");
      }
    }

    const description = xmlExtract(responseText, "Description");
    if (!description) return null;

    return {
      Description: description,
      RegistrationYear: xmlExtract(responseText, "RegistrationYear"),
      CarMake: { CurrentTextValue: xmlExtractNested(responseText, "CarMake", "CurrentTextValue") },
      CarModel: { CurrentTextValue: xmlExtractNested(responseText, "CarModel", "CurrentTextValue") },
      FuelType: { CurrentTextValue: xmlExtractNested(responseText, "FuelType", "CurrentTextValue") },
      Colour: xmlExtract(responseText, "Colour"),
      IndicativeValue: {
        CurrentTextValue: xmlExtractNested(responseText, "IndicativeValue", "CurrentTextValue"),
      },
    };
  };

  try {
    const url = `https://www.regcheck.org.uk/api/reg.asmx/Check?RegistrationNumber=${encodeURIComponent(cleanReg)}&username=${encodeURIComponent(username)}`;

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    console.log(`[REGCHECK] Response status: ${response.status}`);

    if (!response.ok) {
      const text = await response.text();
      console.error(`[REGCHECK] HTTP error ${response.status}:`, text.slice(0, 500));
      return null;
    }

    const responseText = await response.text();
    console.log(`[REGCHECK] Response:`, responseText.slice(0, 800));

    const payload = parseVehiclePayload(responseText);
    if (!payload?.Description) {
      console.log("[REGCHECK] No vehicle data in response");
      return null;
    }

    const { make, model } = extractMakeModel(payload.Description);
    const year = payload.RegistrationYear ? parseInt(payload.RegistrationYear) : undefined;

    let estimatedValue: number | undefined;
    const indicativeVal = payload.IndicativeValue?.CurrentTextValue;
    if (indicativeVal) {
      const val = parseFloat(indicativeVal.replace(/[^0-9.]/g, ""));
      if (!isNaN(val)) estimatedValue = val;
    }

    return {
      registration: cleanReg,
      make: payload.CarMake?.CurrentTextValue || make,
      model: payload.CarModel?.CurrentTextValue || model,
      colour: payload.Colour,
      fuelType: mapFuelType(payload.FuelType?.CurrentTextValue || ""),
      yearOfManufacture: year,
      motDueDate: undefined,
      taxDueDate: undefined,
      motStatus: "NO_TESTS" as const,
      taxStatus: "UNKNOWN" as const,
      motHistory: [],
      mileageHistory: [],
      lastMotDate: undefined,
      lastMotMileage: undefined,
      advisoryCount: 0,
      failureCount: 0,
      commonFailures: [],
      mileageAnomaly: false,
      estimatedValue,
    };
  } catch (error) {
    console.error("[REGCHECK] Lookup failed:", error);
    return null;
  }
}
