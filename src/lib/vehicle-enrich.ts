/**
 * Free automatic enrichment — DVSA MOT API only (no paid lookups).
 */

import { prisma } from "@/lib/prisma";
import { fetchMotHistory, parseMotHistory } from "@/lib/dvsa";
import { parseReminderDays, syncVehicleReminders } from "@/lib/reminder-schedule";
import {
  calculateNextServiceFromMot,
  getManufacturerInterval,
} from "@/lib/service-estimate";
import type { VehicleLookupResult } from "@/types";
import type { Vehicle } from "@prisma/client";

export async function refreshFromDvsa(
  registration: string
): Promise<VehicleLookupResult> {
  const history = await fetchMotHistory(registration);
  return parseMotHistory(history);
}

export function mapLookupToVehicleFields(
  result: VehicleLookupResult
): Partial<Vehicle> {
  const interval = getManufacturerInterval(result.make);
  const service = calculateNextServiceFromMot(
    result.lastMotDate,
    result.lastMotMileage,
    result.make
  );

  return {
    make: result.make ?? undefined,
    model: result.model ?? undefined,
    colour: result.colour ?? undefined,
    fuelType: result.fuelType ?? undefined,
    yearOfManufacture: result.yearOfManufacture ?? undefined,
    motDueDate: result.motDueDate ?? undefined,
    motStatus: result.motStatus,
    motHistoryJson: JSON.stringify(result.motHistory),
    lastMotDate: result.lastMotDate ?? undefined,
    mileage: result.lastMotMileage ?? undefined,
    serviceIntervalMiles: interval.miles,
    serviceIntervalMonths: interval.months,
  };
}

export function applyServiceEstimate(
  fields: Partial<Vehicle>,
  result: VehicleLookupResult,
  keepNextService?: Date | null
): Partial<Vehicle> {
  const service = calculateNextServiceFromMot(
    result.lastMotDate,
    result.lastMotMileage,
    result.make
  );
  if (!service) return fields;

  return {
    ...fields,
    nextServiceDate: keepNextService ?? service.nextServiceDate,
    serviceIntervalMiles: service.serviceIntervalMiles,
    serviceIntervalMonths: service.serviceIntervalMonths,
    mileage: fields.mileage ?? service.mileage ?? undefined,
  };
}

/** Re-fetch DVSA data and update a saved vehicle + reminders. */
export async function enrichVehicleFromDvsa(
  vehicleId: string,
  userId: string
): Promise<Vehicle> {
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, userId },
  });
  if (!vehicle) {
    throw new Error("Vehicle not found");
  }

  const lookup = await refreshFromDvsa(vehicle.registration);
  let updateData = mapLookupToVehicleFields(lookup);
  updateData = applyServiceEstimate(updateData, lookup, vehicle.nextServiceDate);

  updateData.taxDueDate = vehicle.taxDueDate;
  updateData.taxStatus = vehicle.taxStatus;
  updateData.insuranceDueDate = vehicle.insuranceDueDate;
  updateData.warrantyExpiryDate = vehicle.warrantyExpiryDate;
  updateData.breakdownExpiryDate = vehicle.breakdownExpiryDate;
  updateData.nickname = vehicle.nickname;
  updateData.photoUrl = vehicle.photoUrl;
  updateData.notes = vehicle.notes;

  const updated = await prisma.vehicle.update({
    where: { id: vehicleId },
    data: { ...updateData, cachedAt: new Date() },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { reminderDaysJson: true },
  });
  const reminderDays = parseReminderDays(user?.reminderDaysJson);
  await syncVehicleReminders(userId, vehicleId, updated, reminderDays);

  return updated;
}

/** Build create/update fields from a lookup result (client or server). */
export function fieldsFromLookupResult(
  result: VehicleLookupResult,
  keep?: Partial<Vehicle>
): Partial<Vehicle> {
  let data = mapLookupToVehicleFields(result);
  data = applyServiceEstimate(data, result);
  if (keep?.taxDueDate) data.taxDueDate = keep.taxDueDate;
  if (keep?.taxStatus) data.taxStatus = keep.taxStatus;
  return data;
}
