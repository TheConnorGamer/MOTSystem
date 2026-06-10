/**
 * Autoways UK Vehicle Registration API (via RapidAPI)
 * Returns vehicle identity data (make, model, year, colour, etc.)
 * Does NOT return MOT/tax expiry dates — those still need manual entry.
 */

import { VehicleLookupResult } from "@/types";

interface AutowaysResponse {
  code: number;
  country: string;
  query: string;
  error: boolean;
  message: string;
  data: {
    AWN_marque: string;
    AWN_modele: string;
    AWN_couleur: string;
    AWN_energie: string;
    AWN_annee_de_debut_modele: string;
    AWN_cylindre_capacite: string;
    AWN_carrosserie: string;
    AWN_nbr_portes: string;
    AWN_date_mise_en_circulation: string;
    AWN_puissance_chevaux: string;
    AWN_version: string;
    AWN_VIN: string;
  };
}

function mapFuelType(energy: string): string {
  const e = energy.toUpperCase();
  if (e.includes("ESSENCE") || e.includes("PETROL")) return "PETROL";
  if (e.includes("DIESEL")) return "DIESEL";
  if (e.includes("ELECTRI")) return "ELECTRIC";
  if (e.includes("HYBRID")) return "HYBRID";
  if (e.includes("GPL") || e.includes("LPG")) return "LPG";
  return "OTHER";
}

export async function lookupVehicleAutoways(registration: string): Promise<VehicleLookupResult | null> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    console.log("[AUTOWAYS] No RapidAPI key configured");
    return null;
  }

  const cleanReg = registration.replace(/\s/g, "").toUpperCase();
  console.log(`[AUTOWAYS] Looking up: ${cleanReg}`);

  try {
    const url = new URL("https://uk-vehicle-registration-api-british-vehicle-lookup.p.rapidapi.com/");
    url.searchParams.set("plaque", cleanReg);
    url.searchParams.set("without_empty_cases", "false");
    url.searchParams.set("without_ktype", "false");
    url.searchParams.set("without_code_moteur", "false");

    const response = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": "uk-vehicle-registration-api-british-vehicle-lookup.p.rapidapi.com",
      },
    });

    console.log(`[AUTOWAYS] Response status: ${response.status}`);

    if (!response.ok) {
      const text = await response.text();
      console.error(`[AUTOWAYS] HTTP error ${response.status}:`, text.slice(0, 500));
      return null;
    }

    const responseText = await response.text();
    console.log(`[AUTOWAYS] Response:`, responseText.slice(0, 500));

    const data: AutowaysResponse = JSON.parse(responseText);

    if (data.error || !data.data) {
      console.log("[AUTOWAYS] API returned error or no data");
      return null;
    }

    const v = data.data;
    const year = parseInt(v.AWN_annee_de_debut_modele) || undefined;

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

    return {
      registration: cleanReg,
      make: v.AWN_marque,
      model: v.AWN_modele,
      colour: v.AWN_couleur,
      fuelType: mapFuelType(v.AWN_energie),
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
    console.error("[AUTOWAYS] Lookup failed:", error);
    return null;
  }
}
