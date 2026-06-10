/**
 * PDF Report Generator
 *
 * Generates downloadable PDF reports for vehicle MOT history using jspdf.
 */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { VehicleLookupResult } from "@/types";
import { formatDate, daysUntil } from "@/lib/utils";

export function generateVehicleReport(
  vehicle: VehicleLookupResult,
  userName?: string
): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(29, 112, 184); // GOV UK blue
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text("VehicleGuard UK", 14, 20);
  doc.setFontSize(12);
  doc.text("Vehicle MOT & Tax Report", 14, 30);

  // Generated info
  doc.setTextColor(80, 90, 95);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-GB")}`, 14, 50);
  if (userName) doc.text(`Prepared for: ${userName}`, 14, 56);

  // Vehicle Summary
  doc.setTextColor(11, 12, 12);
  doc.setFontSize(16);
  doc.text("Vehicle Summary", 14, 70);

  const summaryData = [
    ["Registration", vehicle.registration],
    ["Make", vehicle.make || "N/A"],
    ["Model", vehicle.model || "N/A"],
    ["Colour", vehicle.colour || "N/A"],
    ["Fuel Type", vehicle.fuelType || "N/A"],
    ["Year", vehicle.yearOfManufacture?.toString() || "N/A"],
  ];

  autoTable(doc, {
    startY: 75,
    head: [["Detail", "Value"]],
    body: summaryData,
    theme: "striped",
    headStyles: { fillColor: [29, 112, 184] },
  });

  // Status Section
  const motDays = daysUntil(vehicle.motDueDate);
  const motStatusText =
    motDays === null
      ? "Unknown"
      : motDays < 0
      ? `Expired ${Math.abs(motDays)} days ago`
      : `Valid - ${motDays} days remaining`;

  doc.setFontSize(16);
  doc.text("Status", 14, (doc as any).lastAutoTable.finalY + 15);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 20,
    head: [["Check", "Status", "Due Date"]],
    body: [
      [
        "MOT",
        motStatusText,
        formatDate(vehicle.motDueDate),
      ],
      [
        "Tax (VED)",
        vehicle.taxStatus || "Unknown",
        formatDate(vehicle.taxDueDate),
      ],
      [
        "Last MOT",
        vehicle.lastMotMileage?.toLocaleString() + " miles" || "N/A",
        formatDate(vehicle.lastMotDate),
      ],
    ],
    theme: "striped",
    headStyles: { fillColor: [29, 112, 184] },
  });

  // Mileage History
  if (vehicle.mileageHistory.length > 0) {
    doc.setFontSize(16);
    doc.text("Mileage History", 14, (doc as any).lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [["Date", "Mileage"]],
      body: vehicle.mileageHistory.map((m) => [
        formatDate(m.date),
        m.value.toLocaleString() + " miles",
      ]),
      theme: "striped",
      headStyles: { fillColor: [29, 112, 184] },
    });
  }

  // Common Failures
  if (vehicle.commonFailures.length > 0) {
    doc.setFontSize(16);
    doc.text("Common Issues for This Model", 14, (doc as any).lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [["Issue"]],
      body: vehicle.commonFailures.map((f) => [f]),
      theme: "striped",
      headStyles: { fillColor: [212, 53, 28] }, // Red for issues
    });
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${totalPages} | VehicleGuard UK | Data sourced from DVSA MOT History API`,
      14,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  return doc;
}
