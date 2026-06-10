/**
 * DVLA Vehicle Enquiry Service (VES) API Integration
 *
 * This provides a fallback for vehicles that do not appear in the DVSA MOT History API.
 * The DVLA VES API returns tax status, MOT expiry, make, model, colour, and fuel type
 * for almost every UK-registered vehicle.
 *
 * To activate:
 * 1. Register at https://developer-portal.driver-vehicle-licensing.api.gov.uk/
 * 2. Subscribe to the "Vehicle Enquiry Service"
 * 3. Add your API key to .env as DVLA_API_KEY
 * 4. Set DVLA_VES_ENABLED=true in .env
 *
 * Cost: ~£0.02 per lookup (subject to DVLA pricing)
 */

import { VehicleLookupResult } from "@/types";

interface DvlaVehicleResponse {
  registrationNumber: string;
  taxStatus: string;
  taxDueDate: string;
  motStatus: string;
  motExpiryDate: string;
  make: string;
  monthOfFirstDvlaRegistration: string;
  monthOfFirstRegistration: string;
  yearOfManufacture: number;
  engineCapacity: number;
  co2Emissions: number;
  fuelType: string;
  markedForExport: boolean;
  colour: string;
  typeApproval: string;
  revenueWeight: number;
  wheelplan: string;
  dateOfLastV5cIssued: string;
}

function mapDvlaToResult(data: DvlaVehicleResponse): VehicleLookupResult {
  const motDueDate = data.motExpiryDate ? new Date(data.motExpiryDate) : undefined;
  const taxDueDate = data.taxDueDate ? new Date(data.taxDueDate) : undefined;

  return {
    registration: data.registrationNumber,
    make: data.make,
    model: undefined, // DVLA does not provide model
    colour: data.colour,
    fuelType: data.fuelType,
    yearOfManufacture: data.yearOfManufacture,
    motDueDate,
    taxDueDate,
    motStatus: data.motStatus === "Valid" ? "VALID" : "EXPIRED",
    taxStatus:
      data.taxStatus === "Taxed"
        ? "TAXED"
        : data.taxStatus === "Untaxed"
        ? "UNTAXED"
        : data.taxStatus === "SORN"
        ? "SORN"
        : "UNKNOWN",
    motHistory: [],
    mileageHistory: [],
    lastMotDate: undefined,
    lastMotMileage: undefined,
    advisoryCount: 0,
    failureCount: 0,
    commonFailures: [],
    mileageAnomaly: false,
    estimatedValue: undefined,
  };
}

export async function lookupVehicleDvla(registration: string): Promise<VehicleLookupResult | null> {
  const apiKey = process.env.DVLA_API_KEY;
  const enabled = process.env.DVLA_VES_ENABLED === "true";

  if (!enabled || !apiKey) {
    return null;
  }

  try {
    const response = await fetch(
      "https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles",
      {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({ registrationNumber: registration.replace(/\s/g, "").toUpperCase() }),
      }
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      console.error(`[DVLA VES] Error ${response.status}:`, await response.text());
      return null;
    }

    const data: DvlaVehicleResponse = await response.json();
    return mapDvlaToResult(data);
  } catch (error) {
    console.error("[DVLA VES] Lookup failed:", error);
    return null;
  }
}
