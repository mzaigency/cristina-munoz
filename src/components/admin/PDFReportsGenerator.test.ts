import { describe, it, expect } from "vitest";
import { downloadReportPDF } from "./PDFReportsGenerator";

describe("PDFReportsGenerator", () => {
  const mockData = {
    tenantName: "Cristina Muñoz",
    rangeLabel: "septiembre 2026",
    generatedAt: "10 sep 2026 a las 10:43",
    total: 3859.00,
    prevTotal: 3200.00,
    growth: 20.6,
    txCount: 115,
    avg: 33.56,
    tips: 0.00,
    discounts: 15.00,
    cash: 1200.00,
    card: 2659.00,
    mixed: 0.00,
    bookingsTotal: 120,
    bookingsCrm: 40,
    bookingsWeb: 80,
    bookingsCancelled: 3,
    stylists: [
      { name: "desi", count: 73, services: 73, tips: 0, sales: 2380.00 },
      { name: "cris", count: 42, services: 42, tips: 0, sales: 1479.00 },
    ],
    services: [
      { name: "Corte y peinado", count: 50, revenue: 1750.00 },
      { name: "Coloración completa", count: 35, revenue: 1400.00 },
      { name: "Tratamiento hidratación", count: 30, revenue: 709.00 },
    ],
    daily: [
      { date: new Date(2026, 8, 1), count: 5, total: 180, cash: 50, card: 130, tips: 0 },
      { date: new Date(2026, 8, 2), count: 8, total: 320, cash: 100, card: 220, tips: 0 },
      { date: new Date(2026, 8, 3), count: 12, total: 540, cash: 200, card: 340, tips: 0 },
    ],
    iva: 669.75,
    netSinIva: 3189.25,
  };

  it("successfully generates monthly report", async () => {
    await expect(downloadReportPDF("monthly", mockData)).resolves.not.toThrow();
  });

  it("successfully generates productivity report", async () => {
    await expect(downloadReportPDF("productivity", mockData)).resolves.not.toThrow();
  });

  it("successfully generates services report", async () => {
    await expect(downloadReportPDF("services", mockData)).resolves.not.toThrow();
  });

  it("successfully generates fiscal report", async () => {
    await expect(downloadReportPDF("fiscal", mockData)).resolves.not.toThrow();
  });
});
