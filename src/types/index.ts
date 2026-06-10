import { Vehicle } from "@prisma/client";

export type MotStatus = "VALID" | "EXPIRED" | "NO_TESTS";
export type TaxStatus = "TAXED" | "SORN" | "UNTAXED" | "UNKNOWN";

export interface MotDefect {
  type:
    | "ADVISORY"
    | "FAIL"
    | "MINOR"
    | "MAJOR"
    | "DANGEROUS"
    | "USER_ENTERED"
    | "PRE_EU"
    | "PRS";
  text: string;
  dangerous: boolean;
}

export interface MotTest {
  testId?: string;
  completedDate: string;
  testResult: "PASSED" | "FAILED" | "ABANDONED" | "ABORTED";
  expiryDate?: string;
  odometerValue: number;
  odometerUnit: string;
  motTestNumber?: string;
  rfrAndComments: MotDefect[];
  defects?: MotDefect[];
  testType?: string;
}

export interface MotHistoryResponse {
  registration: string;
  make: string;
  model: string;
  firstUsedDate: string;
  fuelType: string;
  primaryColour: string;
  vehicleId: string;
  motTests: MotTest[];
}

export interface VehicleLookupResult {
  registration: string;
  make?: string;
  model?: string;
  colour?: string;
  fuelType?: string;
  yearOfManufacture?: number;
  engineSize?: number;
  motDueDate?: Date;
  taxDueDate?: Date;
  motStatus: MotStatus;
  taxStatus: TaxStatus;
  motHistory: MotTest[];
  mileageHistory: { date: string; value: number }[];
  lastMotDate?: Date;
  lastMotMileage?: number;
  advisoryCount: number;
  failureCount: number;
  commonFailures: string[];
  mileageAnomaly?: boolean;
  estimatedValue?: number;
}

export interface ServiceEstimate {
  nextServiceDate: Date;
  nextServiceMileage: number;
  serviceItems: string[];
  urgency: "low" | "medium" | "high";
}

export interface DashboardVehicle extends Vehicle {
  daysUntilMot: number | null;
  daysUntilTax: number | null;
  daysUntilService: number | null;
  statusColor: "green" | "yellow" | "red" | "gray";
}

export interface ReminderPreferences {
  emailReminders: boolean;
  smsReminders: boolean;
  motReminders: boolean;
  taxReminders: boolean;
  serviceReminders: boolean;
  daysBeforeMot: number[];
  daysBeforeTax: number[];
  daysBeforeService: number[];
}

export interface ApiError {
  message: string;
  code: string;
  status: number;
}
