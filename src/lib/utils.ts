import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function daysUntil(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  const target = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getStatusColor(days: number | null): string {
  if (days === null) return "gray";
  if (days < 0) return "red";
  if (days <= 14) return "red";
  if (days <= 30) return "yellow";
  return "green";
}

export function getStatusBadgeClass(days: number | null): string {
  const color = getStatusColor(days);
  switch (color) {
    case "red":
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
    case "yellow":
      return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800";
    case "green":
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
  }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function sanitiseReg(registration: string): string {
  // Remove spaces and uppercase for API calls
  return registration.replace(/\s/g, "").toUpperCase();
}

export function isValidReg(registration: string): boolean {
  // Basic UK registration validation
  const cleaned = sanitiseReg(registration);
  // Current format: 2 letters + 2 digits + space + 3 letters
  const currentFormat = /^[A-Z]{2}\d{2}[A-Z]{3}$/;
  // Older format: 1-3 letters + 1-3 digits + 3 letters (prefix/suffix)
  const prefixFormat = /^[A-Z]{1,3}\d{1,3}[A-Z]{3}$/;
  // Dateless format: various
  const datelessFormat = /^[A-Z]{1,3}\d{1,4}$/;
  
  return (
    currentFormat.test(cleaned) ||
    prefixFormat.test(cleaned) ||
    datelessFormat.test(cleaned) ||
    /^\d{1,4}[A-Z]{1,3}$/.test(cleaned)
  );
}
