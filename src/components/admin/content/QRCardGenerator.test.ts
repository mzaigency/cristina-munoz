import { describe, it, expect } from "vitest";
import { FORMAT_CONFIG } from "./QRCardGenerator";

describe("QRCardGenerator FORMAT_CONFIG", () => {
  it("contiene los 4 formatos requeridos con sus medidas exactas", () => {
    expect(FORMAT_CONFIG).toHaveProperty("counter");
    expect(FORMAT_CONFIG).toHaveProperty("poster");
    expect(FORMAT_CONFIG).toHaveProperty("mirror");
    expect(FORMAT_CONFIG).toHaveProperty("qr_only");

    // Tarjeta mostrador
    expect(FORMAT_CONFIG.counter.label).toBe("Tarjeta");
    expect(FORMAT_CONFIG.counter.dimensions).toBe("15 × 10 cm");
    expect(FORMAT_CONFIG.counter.widthMm).toBe(150);
    expect(FORMAT_CONFIG.counter.heightMm).toBe(100);

    // Folleto / Cartel escaparate A4
    expect(FORMAT_CONFIG.poster.label).toBe("Folleto");
    expect(FORMAT_CONFIG.poster.dimensions).toBe("21 × 29,7 cm");
    expect(FORMAT_CONFIG.poster.widthMm).toBe(210);
    expect(FORMAT_CONFIG.poster.heightMm).toBe(297);

    // Sticker QR espejo / mesa
    expect(FORMAT_CONFIG.mirror.label).toBe("Sticker QR");
    expect(FORMAT_CONFIG.mirror.dimensions).toBe("12 × 12 cm");
    expect(FORMAT_CONFIG.mirror.widthMm).toBe(120);
    expect(FORMAT_CONFIG.mirror.heightMm).toBe(120);

    // Solo QR
    expect(FORMAT_CONFIG.qr_only.label).toBe("Solo QR");
    expect(FORMAT_CONFIG.qr_only.dimensions).toBe("8 × 8 cm");
    expect(FORMAT_CONFIG.qr_only.widthMm).toBe(80);
    expect(FORMAT_CONFIG.qr_only.heightMm).toBe(80);
  });
});
