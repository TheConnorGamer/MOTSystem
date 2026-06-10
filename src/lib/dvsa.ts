/**
 * DVSA MOT History API Integration
 *
 * This module handles the OAuth2 client credentials flow for the DVSA MOT History API,
 * including token caching in Redis, rate limiting, and intelligent response caching.
 *
 * API Documentation: https://documentation.history.mot.api.gov.uk/
 */

import { redis } from "./redis";
import { lookupVehicleDvla } from "./dvla";
import { lookupVehicleRapidApi } from "./rapidapi";
import { lookupVehicleAutoways } from "./autoways";
import { lookupVehicleRegCheck } from "./regcheck";
import {
  MotHistoryResponse,
  VehicleLookupResult,
  MotStatus,
  MotTest,
  MotDefect,
} from "@/types";

function parseOdometer(value: unknown): number {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = parseInt(value.replace(/,/g, ""), 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function normalizeDefect(defect: Partial<MotDefect>): MotDefect {
  const type = (defect.type || "ADVISORY").toUpperCase() as MotDefect["type"];
  return {
    type,
    text: defect.text || "",
    dangerous: Boolean(defect.dangerous),
  };
}

function normalizeMotTest(test: Record<string, unknown>): MotTest {
  const defects = (test.defects || test.rfrAndComments || []) as Partial<MotDefect>[];
  const rfrAndComments = defects.map(normalizeDefect);

  return {
    testId: String(test.testId || test.motTestNumber || ""),
    completedDate: String(test.completedDate),
    testResult: String(test.testResult || "PASSED").toUpperCase() as MotTest["testResult"],
    expiryDate: test.expiryDate ? String(test.expiryDate) : undefined,
    odometerValue: parseOdometer(test.odometerValue),
    odometerUnit: String(test.odometerUnit || "MI"),
    motTestNumber: test.motTestNumber ? String(test.motTestNumber) : undefined,
    rfrAndComments,
    defects: rfrAndComments,
    testType: test.testType ? String(test.testType) : undefined,
  };
}

function normalizeMotHistory(data: MotHistoryResponse): MotHistoryResponse {
  return {
    ...data,
    motTests: (data.motTests || []).map((test) =>
      normalizeMotTest(test as unknown as Record<string, unknown>)
    ),
  };
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

const TOKEN_CACHE_KEY = "dvsa:access_token";
const API_CACHE_PREFIX = "dvsa:vehicle:";
const CACHE_TTL_SECONDS = 60 * 60 * 24; // 24 hours

async function fetchMotHistoryResponse(
  url: string,
  token: string,
  apiKey: string,
  cleanReg: string,
  allowRetry = true
): Promise<Response> {
  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-API-Key": apiKey,
      Accept: "application/json",
    },
  });

  if (allowRetry && (response.status === 401 || response.status === 403)) {
    console.log(`[DVSA] Auth error ${response.status} for ${cleanReg}, refreshing token`);
    try {
      await redis.del(TOKEN_CACHE_KEY);
    } catch {
      // Redis unavailable
    }

    const freshToken = await getAccessToken(true);
    if (freshToken !== token) {
      return fetchMotHistoryResponse(url, freshToken, apiKey, cleanReg, false);
    }
  }

  return response;
}

/**
 * Obtain an access token using OAuth2 client credentials flow.
 * Tokens are cached in Redis to avoid unnecessary re-authentication.
 */
async function getAccessToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh) {
    // Check Redis cache first
    try {
      const cached = await redis.get(TOKEN_CACHE_KEY);
      if (cached) return cached;
    } catch {
      // Redis unavailable — fetch fresh token
    }
  }

  const tokenUrl = process.env.DVSA_TOKEN_URL!;
  const clientId = process.env.DVSA_CLIENT_ID!;
  const clientSecret = process.env.DVSA_CLIENT_SECRET!;
  const scope = process.env.DVSA_SCOPE!;

  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", clientId);
  params.append("client_secret", clientSecret);
  params.append("scope", scope);

  console.log(`[DVSA] Requesting OAuth token from ${tokenUrl}`);
  const response = await fetch(tokenUrl, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  console.log(`[DVSA] Token response: ${response.status}`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `DVSA token request failed: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data: TokenResponse = await response.json();

  // Cache token with 90% of expiry time as buffer
  try {
    const cacheTtl = Math.floor(data.expires_in * 0.9);
    await redis.setex(TOKEN_CACHE_KEY, cacheTtl, data.access_token);
  } catch {
    // Redis unavailable — token won't be cached
  }

  return data.access_token;
}

/**
 * Fetch MOT history for a given registration from the DVSA API.
 * Results are cached for 24 hours to reduce API load and improve performance.
 */
export async function fetchMotHistory(
  registration: string
): Promise<MotHistoryResponse> {
  const cleanReg = registration.replace(/\s/g, "").toUpperCase();
  const cacheKey = `${API_CACHE_PREFIX}${cleanReg}`;

  // Check cache
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as MotHistoryResponse;
  } catch {
    // Redis unavailable — fetch fresh data
  }

  const token = await getAccessToken();
  const apiBase = process.env.DVSA_API_BASE || "https://history.mot.api.gov.uk";
  const apiKey = process.env.DVSA_API_KEY!;

  const url = `${apiBase}/v1/trade/vehicles/registration/${cleanReg}`;

  console.log(`[DVSA] Fetching MOT history for ${cleanReg} from ${url}`);
  const response = await fetchMotHistoryResponse(url, token, apiKey, cleanReg);

  console.log(`[DVSA] MOT history response: ${response.status}`);
  if (response.status === 404) {
    throw new Error(`Vehicle not found: ${registration}`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `DVSA API error: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const raw: MotHistoryResponse = await response.json();
  const data = normalizeMotHistory(raw);

  // Cache successful response for 24 hours
  try {
    await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(data));
  } catch {
    // Redis unavailable — response won't be cached
  }

  return data;
}

/**
 * Enrich raw MOT history data into a structured VehicleLookupResult.
 * Includes mileage fraud detection, common failure analysis, and estimated valuation.
 */
export function parseMotHistory(
  data: MotHistoryResponse
): VehicleLookupResult {
  const motTests = data.motTests || [];

  // Sort by date descending
  const sortedTests = [...motTests].sort(
    (a, b) =>
      new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime()
  );

  const latestTest = sortedTests[0];

  // Build mileage history
  const mileageHistory = sortedTests
    .filter((t) => t.odometerValue && t.odometerValue > 0)
    .map((t) => ({
      date: t.completedDate,
      value: t.odometerValue,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Detect mileage anomalies (fraud detection)
  let mileageAnomaly = false;
  for (let i = 1; i < mileageHistory.length; i++) {
    if (mileageHistory[i].value < mileageHistory[i - 1].value) {
      mileageAnomaly = true;
      break;
    }
  }

  // Calculate advisory and failure counts
  const allComments = sortedTests.flatMap((t) => t.rfrAndComments || []);
  const advisories = allComments.filter((c) => c.type === "ADVISORY");
  const failures = allComments.filter(
    (c) => c.type === "FAIL" || c.type === "MAJOR" || c.type === "DANGEROUS"
  );

  // Extract common failures (top 5)
  const failureMap = new Map<string, number>();
  failures.forEach((f) => {
    const key = f.text;
    failureMap.set(key, (failureMap.get(key) || 0) + 1);
  });
  const commonFailures = Array.from(failureMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([text]) => text);

  // Determine MOT status and due date
  let motDueDate: Date | undefined;
  let motStatus: MotStatus = "NO_TESTS";

  if (latestTest) {
    if (latestTest.expiryDate) {
      motDueDate = new Date(latestTest.expiryDate);
      motStatus = motDueDate > new Date() ? "VALID" : "EXPIRED";
    } else if (latestTest.testResult === "FAILED") {
      motStatus = "EXPIRED";
    }
  }

  // Very basic estimated valuation based on age
  // In production, this would integrate with a valuation API
  const yearOfManufacture = data.firstUsedDate
    ? parseInt(data.firstUsedDate.split("-")[0])
    : undefined;
  let estimatedValue: number | undefined;
  if (yearOfManufacture) {
    const age = new Date().getFullYear() - yearOfManufacture;
    if (age <= 1) estimatedValue = 25000;
    else if (age <= 3) estimatedValue = 18000;
    else if (age <= 5) estimatedValue = 12000;
    else if (age <= 10) estimatedValue = 7000;
    else if (age <= 15) estimatedValue = 3500;
    else estimatedValue = 1500;
  }

  return {
    registration: data.registration,
    make: data.make,
    model: data.model,
    colour: data.primaryColour,
    fuelType: data.fuelType,
    yearOfManufacture,
    motDueDate,
    // Tax info is not available via MOT API - would need DVLA integration
    taxDueDate: undefined,
    motStatus,
    taxStatus: "UNKNOWN",
    motHistory: sortedTests,
    mileageHistory,
    lastMotDate: latestTest ? new Date(latestTest.completedDate) : undefined,
    lastMotMileage: latestTest?.odometerValue,
    advisoryCount: advisories.length,
    failureCount: failures.length,
    commonFailures,
    mileageAnomaly,
    estimatedValue,
  };
}

/**
 * Perform a full vehicle lookup with MOT history.
 * This is the main entry point for the vehicle lookup engine.
 * Falls back to DVLA VES API if DVSA has no record.
 */
export async function lookupVehicle(
  registration: string
): Promise<VehicleLookupResult> {
  try {
    const history = await fetchMotHistory(registration);
    return parseMotHistory(history);
  } catch (error: any) {
    console.log(`[LOOKUP] DVSA failed for ${registration}: ${error.message}`);

    // Try DVLA VES fallback for vehicles not in DVSA database
    const dvlaResult = await lookupVehicleDvla(registration);
    if (dvlaResult) {
      console.log(`[LOOKUP] DVSA missed ${registration}, using DVLA fallback`);
      return dvlaResult;
    }

    // RegCheck is a direct paid API and usually more reliable than RapidAPI free tiers
    console.log(`[LOOKUP] Trying RegCheck fallback for ${registration}`);
    const regcheckResult = await lookupVehicleRegCheck(registration);
    if (regcheckResult) {
      console.log(`[LOOKUP] Using RegCheck fallback for ${registration}`);
      return regcheckResult;
    }

    // RapidAPI providers require an active subscription on the specific API
    console.log(`[LOOKUP] Trying RapidAPI fallback for ${registration}`);
    const rapidResult = await lookupVehicleRapidApi(registration);
    if (rapidResult) {
      console.log(`[LOOKUP] Using RapidAPI fallback for ${registration}`);
      return rapidResult;
    }

    // Autoways is another RapidAPI provider (vehicle identity only)
    console.log(`[LOOKUP] Trying Autoways fallback for ${registration}`);
    const autowaysResult = await lookupVehicleAutoways(registration);
    if (autowaysResult) {
      console.log(`[LOOKUP] Using Autoways fallback for ${registration}`);
      return autowaysResult;
    }

    console.log(`[LOOKUP] All fallbacks failed for ${registration}`);
    throw error;
  }
}
