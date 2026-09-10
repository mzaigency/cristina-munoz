import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfQuarter,
  endOfQuarter,
  subQuarters,
  eachDayOfInterval,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";
import { FileText, Loader2, Euro, Users, TrendingUp, Receipt, Sparkles } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface PDFReportsGeneratorProps {
  tenantId: string;
  tenantName?: string;
}

export type ReportType = "monthly" | "productivity" | "services" | "fiscal";
export type RangeMode = "month" | "quarter" | "prev_quarter" | "custom";

const BRAND_PRIMARY = "#22408C"; // Glow Navy Brand (#22408C)
const BRAND_ACCENT = "#3B82F6";  // Clean Cobalt Accent
const BRAND_DARK = "#131520";    // Glow Ink Dark (#131520)

const fmtEUR = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n || 0);

// ============================================================
// DATA FETCHING
// ============================================================

export async function fetchReportData(
  tenantId: string,
  tenantName: string,
  start: Date,
  end: Date,
  label: string
) {
  const startISO = start.toISOString();
  const endISO = end.toISOString();

  // Comparativa: período inmediatamente anterior, misma duración
  const durMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(start.getTime() - durMs - 1);

  const [{ data: tx }, { data: prevTx }, { data: bookings }] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, total, payment_method, tip_amount, discount, stylist, stylist_id, services, customer_name, created_at")
      .eq("tenant_id", tenantId)
      .eq("voided", false)
      .gte("created_at", startISO)
      .lte("created_at", endISO)
      .order("created_at", { ascending: true }),
    supabase
      .from("transactions")
      .select("total")
      .eq("tenant_id", tenantId)
      .eq("voided", false)
      .gte("created_at", prevStart.toISOString())
      .lte("created_at", prevEnd.toISOString()),
    supabase
      .from("bookings")
      .select("id, status, canal, created_at")
      .eq("tenant_id", tenantId)
      .gte("created_at", startISO)
      .lte("created_at", endISO),
  ]);

  const total = (tx || []).reduce((s, t: any) => s + Number(t.total || 0), 0);
  const txCount = tx?.length || 0;
  const avg = txCount > 0 ? total / txCount : 0;
  const cash = (tx || [])
    .filter((t: any) => t.payment_method === "cash")
    .reduce((s, t: any) => s + Number(t.total || 0), 0);
  const card = (tx || [])
    .filter((t: any) => t.payment_method === "card")
    .reduce((s, t: any) => s + Number(t.total || 0), 0);
  const mixed = (tx || [])
    .filter((t: any) => t.payment_method === "mixed")
    .reduce((s, t: any) => s + Number(t.total || 0), 0);
  const tips = (tx || []).reduce((s, t: any) => s + Number(t.tip_amount || 0), 0);
  const discounts = (tx || []).reduce((s, t: any) => s + Number(t.discount || 0), 0);
  const prevTotal = (prevTx || []).reduce((s, t: any) => s + Number(t.total || 0), 0);
  const growth = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;

  // Por estilista
  const byStylist: Record<string, { name: string; sales: number; count: number; tips: number; services: number }> =
    {};
  (tx || []).forEach((t: any) => {
    const key = t.stylist || "Sin asignar";
    if (!byStylist[key]) byStylist[key] = { name: key, sales: 0, count: 0, tips: 0, services: 0 };
    byStylist[key].sales += Number(t.total || 0);
    byStylist[key].count += 1;
    byStylist[key].tips += Number(t.tip_amount || 0);
    const svcs = Array.isArray(t.services) ? t.services : [];
    byStylist[key].services += svcs.reduce((c: number, s: any) => c + (s.quantity || 1), 0);
  });
  const stylists = Object.values(byStylist).sort((a, b) => b.sales - a.sales);

  // Por servicio
  const byService: Record<string, { name: string; count: number; revenue: number }> = {};
  (tx || []).forEach((t: any) => {
    const svcs = Array.isArray(t.services) ? t.services : [];
    svcs.forEach((s: any) => {
      const name = s.name || "Sin nombre";
      if (!byService[name]) byService[name] = { name, count: 0, revenue: 0 };
      byService[name].count += s.quantity || 1;
      byService[name].revenue += Number(s.total || (s.price || 0) * (s.quantity || 1));
    });
  });
  const services = Object.values(byService).sort((a, b) => b.revenue - a.revenue);

  // Evolución diaria (para sparkline + fiscal)
  const days = eachDayOfInterval({ start, end });
  const dailyMap: Record<
    string,
    { date: Date; total: number; cash: number; card: number; count: number; tips: number }
  > = {};
  days.forEach((d) => {
    const key = format(d, "yyyy-MM-dd");
    dailyMap[key] = { date: d, total: 0, cash: 0, card: 0, count: 0, tips: 0 };
  });
  (tx || []).forEach((t: any) => {
    const key = format(new Date(t.created_at), "yyyy-MM-dd");
    if (!dailyMap[key]) return;
    dailyMap[key].total += Number(t.total || 0);
    dailyMap[key].count += 1;
    dailyMap[key].tips += Number(t.tip_amount || 0);
    if (t.payment_method === "cash") dailyMap[key].cash += Number(t.total || 0);
    if (t.payment_method === "card") dailyMap[key].card += Number(t.total || 0);
  });
  const daily = Object.values(dailyMap);

  // Reservas (para resumen ejecutivo)
  const bookingsTotal = bookings?.length || 0;
  const bookingsCancelled = (bookings || []).filter((b: any) => b.status === "cancelled").length;
  const bookingsCrm = (bookings || []).filter((b: any) => b.canal === "crm").length;
  const bookingsWeb = bookingsTotal - bookingsCrm;

  return {
    rawTransactions: tx || [],
    tenantName,
    rangeLabel: label,
    generatedAt: format(new Date(), "d MMM yyyy 'a las' HH:mm", { locale: es }),
    total,
    txCount,
    avg,
    cash,
    card,
    mixed,
    tips,
    discounts,
    prevTotal,
    growth,
    stylists,
    services,
    daily,
    bookingsTotal,
    bookingsCancelled,
    bookingsCrm,
    bookingsWeb,
    iva: total - total / 1.21, // IVA 21% estimado
    netSinIva: total / 1.21,
  };
}

// ============================================================
// NATIVE VECTOR PDF GENERATION (selectable text, not images)
// ============================================================

function hexToRGB(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
}

const C = {
  primary: hexToRGB(BRAND_PRIMARY),
  accent: hexToRGB(BRAND_ACCENT),
  dark: hexToRGB(BRAND_DARK),
  slate700: hexToRGB("#3A3D4A"),
  slate500: hexToRGB("#676B7E"),
  slate400: hexToRGB("#9DA1B2"),
  slate200: hexToRGB("#E4E6EF"),
  slate100: hexToRGB("#F2F3F8"),
  slate50: hexToRGB("#F6F7FB"),
  white: [255, 255, 255] as [number, number, number],
  green700: hexToRGB("#15803D"),
  green200: hexToRGB("#BBF7D0"),
  green100: hexToRGB("#DCFCE7"),
  red700: hexToRGB("#B91C1C"),
  red100: hexToRGB("#FEE2E2"),
  darkCard1: hexToRGB("#131520"),
};

const PW = 210; // A4 width mm
const PH = 297; // A4 height mm
const ML = 18;  // margin left
const MR = 18;  // margin right
const MT = 18;  // margin top
const MB = 22;  // margin bottom
const CW = PW - ML - MR; // content width

interface PDFCtx {
  doc: jsPDF;
  y: number;
}

function ensureSpace(ctx: PDFCtx, needed: number): void {
  if (ctx.y + needed > PH - MB) {
    ctx.doc.addPage();
    ctx.y = MT;
  }
}

function drawRoundedRect(
  doc: jsPDF,
  x: number, y: number, w: number, h: number, r: number,
  fillColor?: [number, number, number],
  strokeColor?: [number, number, number],
  lineWidth?: number
): void {
  if (fillColor) doc.setFillColor(...fillColor);
  if (strokeColor) {
    doc.setDrawColor(...strokeColor);
    doc.setLineWidth(lineWidth || 0.3);
  }
  const mode = fillColor && strokeColor ? "FD" : fillColor ? "F" : "S";
  doc.roundedRect(x, y, w, h, Math.min(r, h / 2), Math.min(r, h / 2), mode);
}

function drawDivider(doc: jsPDF, x: number, y: number, w: number): void {
  // Hairline subtle rule
  doc.setDrawColor(...C.slate200);
  doc.setLineWidth(0.3);
  doc.line(x, y, x + w, y);

  // Elegant brand indicator on left
  doc.setFillColor(...C.primary);
  doc.rect(x, y - 0.35, 24, 0.7, "F");
}

function drawPill(
  doc: jsPDF, text: string, x: number, y: number,
  bgColor: [number, number, number], textColor: [number, number, number],
  borderColor?: [number, number, number], fontSize?: number
): { w: number; h: number } {
  const fs = fontSize || 6.5;
  doc.setFontSize(fs);
  doc.setFont("helvetica", "bold");
  const tw = doc.getTextWidth(text);
  const padX = 3;
  const padY = 1.5;
  const pw = tw + padX * 2;
  const ph = fs * 0.4 + padY * 2;
  drawRoundedRect(doc, x, y, pw, ph, ph / 2, bgColor, borderColor || bgColor, 0.2);
  doc.setTextColor(...textColor);
  doc.text(text, x + padX, y + ph / 2 + fs * 0.12, { baseline: "middle" });
  return { w: pw, h: ph };
}

// ── Executive Header ──
function drawHeader(ctx: PDFCtx, d: any, reportTitle: string): void {
  const { doc } = ctx;
  const headerStartY = MT + 2;

  // ── Left Column: Salon brand & document title ──
  ctx.y = headerStartY;

  // Salon title: Luxury Editorial Serif
  doc.setFont("times", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...C.dark);
  doc.text(d.tenantName || "Salón", ML, ctx.y + 7);

  // Subtitle + Period Pill
  ctx.y += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...C.slate500);
  doc.text(reportTitle, ML, ctx.y + 3);
  const stW = doc.getTextWidth(reportTitle);
  drawPill(doc, d.rangeLabel, ML + stW + 3, ctx.y, C.slate100, C.dark, C.slate200, 6.5);

  // ── Right Column: Official Meta Box ──
  const metaW = 54;
  const metaH = 22;
  const metaX = ML + CW - metaW;
  const metaY = headerStartY;

  drawRoundedRect(doc, metaX, metaY, metaW, metaH, 2, C.slate50, C.slate200, 0.25);

  doc.setFontSize(5.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.slate500);
  doc.text("EMISIÓN:", metaX + 3.5, metaY + 4.5);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  doc.text(d.generatedAt || "", metaX + 3.5, metaY + 8.8);

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.slate500);
  doc.text("Moneda: EUR (€)", metaX + 3.5, metaY + 13);

  // Verification badge: clean green pill badge safely inside the box
  drawPill(doc, "Verificado", metaX + 3.5, metaY + 15.5, C.green100, C.green700, C.green200, 5.8);

  // ── Spacing & Divider ──
  // Guarantee divider is comfortably below both left column and right meta box
  ctx.y = Math.max(ctx.y + 7, metaY + metaH + 5);
  drawDivider(doc, ML, ctx.y, CW);
  ctx.y += 6;
}

// ── Section Title ──
function drawSectionTitle(ctx: PDFCtx, title: string): void {
  ensureSpace(ctx, 12);
  const { doc } = ctx;

  // Solid brand accent bar (left)
  doc.setFillColor(...C.primary);
  doc.roundedRect(ML, ctx.y + 0.5, 1.5, 4, 0.75, 0.75, "F");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  doc.text(title.toUpperCase(), ML + 4.5, ctx.y + 3.5);
  ctx.y += 7.5;
}

// ── KPI Card ──
function drawKPICard(
  ctx: PDFCtx, x: number, w: number,
  label: string, value: string, sub?: string,
  highlight?: boolean, growthVal?: number
): number {
  const { doc } = ctx;
  const hasGrowth = growthVal && isFinite(growthVal) && growthVal !== 0;
  const cardH = sub ? (hasGrowth ? 24 : 20) : (hasGrowth ? 22 : 17);
  ensureSpace(ctx, cardH + 2);

  if (highlight) {
    drawRoundedRect(doc, x, ctx.y, w, cardH, 2, C.dark);

    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.slate400);
    doc.text(label.toUpperCase(), x + 4, ctx.y + 5);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.white);
    doc.text(value, x + 4, ctx.y + 12);

    if (sub) {
      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.slate400);
      doc.text(sub, x + 4, ctx.y + 16.5);
    }
  } else {
    drawRoundedRect(doc, x, ctx.y, w, cardH, 2, C.white, C.slate200, 0.25);

    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.slate500);
    doc.text(label.toUpperCase(), x + 4, ctx.y + 5);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.dark);
    doc.text(value, x + 4, ctx.y + 12);

    if (sub) {
      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.slate500);
      doc.text(sub, x + 4, ctx.y + 16.5);
    }
  }

  if (hasGrowth) {
    const up = growthVal! > 0;
    const badgeText = `${up ? "+" : "-"}${Math.abs(growthVal!).toFixed(1)}%`;
    drawPill(doc, badgeText, x + 4, ctx.y + (sub ? 18.5 : 14.5), up ? C.green100 : C.red100, up ? C.green700 : C.red700, undefined, 6);
  }

  return cardH;
}

// ── KPI Grid ──
function drawKPIGrid(
  ctx: PDFCtx,
  cards: Array<{ label: string; value: string; sub?: string; highlight?: boolean; growth?: number }>
): void {
  const cols = cards.length;
  const gap = 3;
  const cardW = (CW - (cols - 1) * gap) / cols;
  let maxH = 0;
  const savedY = ctx.y;
  cards.forEach((c, i) => {
    ctx.y = savedY;
    const h = drawKPICard(ctx, ML + i * (cardW + gap), cardW, c.label, c.value, c.sub, c.highlight, c.growth);
    maxH = Math.max(maxH, h);
  });
  ctx.y = savedY + maxH + 4;
}

// ── Bar Chart Row ──
function drawBarRow(ctx: PDFCtx, label: string, value: string, pct: number): void {
  ensureSpace(ctx, 7);
  const { doc } = ctx;

  const labelW = 40;
  const valueW = 34;
  const barX = ML + labelW;
  const barW = CW - labelW - valueW - 2;

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.slate700);
  const truncLabel = label.length > 22 ? label.substring(0, 20) + "…" : label;
  doc.text(truncLabel, ML, ctx.y + 3.5);

  // Track
  drawRoundedRect(doc, barX, ctx.y + 1.5, barW, 2.5, 1.25, C.slate100);

  // Fill
  const fillW = Math.max(barW * (pct / 100), 0.5);
  doc.setFillColor(...C.primary);
  doc.roundedRect(barX, ctx.y + 1.5, fillW, 2.5, 1.25, 1.25, "F");

  // Value
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  doc.text(value, ML + CW, ctx.y + 3.5, { align: "right" });

  ctx.y += 7;
}

// ── Table (via jspdf-autotable) ──
function drawTable(
  ctx: PDFCtx,
  headers: string[],
  rows: string[][],
  numCols?: number[],
  totalRow?: string[] | null
): void {
  const { doc } = ctx;
  ensureSpace(ctx, 15);

  const numSet = new Set(numCols || []);
  const bodyData = [...rows];
  if (totalRow) bodyData.push(totalRow);
  const totalRowIdx = totalRow ? bodyData.length - 1 : -1;

  autoTable(doc, {
    startY: ctx.y,
    margin: { left: ML, right: MR },
    head: [headers],
    body: bodyData,
    theme: "plain",
    styles: {
      fontSize: 7.5,
      cellPadding: { top: 2.2, bottom: 2.2, left: 2.5, right: 2.5 },
      textColor: C.dark,
      lineColor: C.slate100,
      lineWidth: 0.2,
      font: "helvetica",
    },
    headStyles: {
      fillColor: C.slate50,
      textColor: C.slate700,
      fontSize: 6.5,
      fontStyle: "bold",
      cellPadding: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
    },
    columnStyles: Object.fromEntries(
      headers.map((_, i) => [
        i,
        numSet.has(i) ? { halign: "right" as const } : {},
      ])
    ),
    alternateRowStyles: {
      fillColor: [250, 252, 254] as [number, number, number],
    },
    didParseCell: (data: any) => {
      if (data.section === "body" && data.row.index === totalRowIdx) {
        data.cell.styles.fillColor = C.slate100;
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = C.dark;
      }
      if (data.section === "body" && data.column.index === 0 && data.row.index !== totalRowIdx) {
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  ctx.y = (doc as any).lastAutoTable?.finalY + 4 || ctx.y + 20;
}

// ── Sparkline (vector line chart) ──
function drawSparkline(ctx: PDFCtx, daily: any[]): void {
  if (!daily.length) return;
  ensureSpace(ctx, 30);
  const { doc } = ctx;

  const chartX = ML + 4;
  const chartW = CW - 8;
  const chartH = 18;
  const chartY = ctx.y + 2;

  drawRoundedRect(doc, ML, ctx.y, CW, chartH + 14, 2, C.slate50, C.slate200, 0.2);

  const max = Math.max(...daily.map((d: any) => d.total), 1);
  const stepX = chartW / Math.max(daily.length - 1, 1);

  doc.setDrawColor(...C.primary);
  doc.setLineWidth(0.5);
  for (let i = 0; i < daily.length - 1; i++) {
    const x1 = chartX + i * stepX;
    const y1 = chartY + chartH - (daily[i].total / max) * (chartH - 2);
    const x2 = chartX + (i + 1) * stepX;
    const y2 = chartY + chartH - (daily[i + 1].total / max) * (chartH - 2);
    doc.line(x1, y1, x2, y2);
  }

  // Peak dot
  const maxIdx = daily.reduce((best: number, d: any, i: number) => (d.total > daily[best].total ? i : best), 0);
  const peakX = chartX + maxIdx * stepX;
  const peakY = chartY + chartH - (daily[maxIdx].total / max) * (chartH - 2);
  doc.setFillColor(...C.primary);
  doc.circle(peakX, peakY, 1, "F");

  // Labels below
  const labelY = chartY + chartH + 5;
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.slate500);
  doc.text(format(daily[0].date, "d MMM", { locale: es }), chartX, labelY);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.primary);
  doc.text(
    `Mejor día: ${format(daily[maxIdx].date, "d MMM", { locale: es })} · ${fmtEUR(daily[maxIdx].total)}`,
    chartX + chartW / 2, labelY, { align: "center" }
  );

  doc.setTextColor(...C.dark);
  doc.text(
    `Total: ${fmtEUR(daily.reduce((s: number, d: any) => s + d.total, 0))}`,
    chartX + chartW, labelY, { align: "right" }
  );

  ctx.y += chartH + 18;
}

// ── Footer (all pages) ──
function drawFooter(ctx: PDFCtx, d: any): void {
  const { doc } = ctx;
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...C.slate200);
    doc.setLineWidth(0.3);
    doc.line(ML, PH - MB + 4, ML + CW, PH - MB + 4);

    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.slate400);
    doc.text(
      `Documento oficial emitido por GlowApp para ${d.tenantName || "Salón"} · Uso contable y fiscal.`,
      ML, PH - MB + 8
    );
    doc.text(
      `glowapp.app · Confidencial · Pág. ${p}/${totalPages}`,
      ML + CW, PH - MB + 8, { align: "right" }
    );
  }
}

// ============================================================
// REPORT BODY BUILDERS
// ============================================================

function buildMonthlyPDF(ctx: PDFCtx, d: any): void {
  drawSectionTitle(ctx, "Indicadores clave");
  drawKPIGrid(ctx, [
    { label: "Ingresos", value: fmtEUR(d.total), highlight: true, growth: d.growth },
    { label: "Transacciones", value: String(d.txCount), sub: `vs. ${fmtEUR(d.prevTotal)} anterior` },
    { label: "Ticket medio", value: fmtEUR(d.avg) },
    { label: "Propinas", value: fmtEUR(d.tips), sub: `Descuentos: ${fmtEUR(d.discounts)}` },
  ]);

  drawSectionTitle(ctx, "Evolución diaria");
  drawSparkline(ctx, d.daily);

  drawSectionTitle(ctx, "Métodos de pago");
  const pmT = d.total || 1;
  if (d.cash > 0) drawBarRow(ctx, "Efectivo", `${fmtEUR(d.cash)} (${((d.cash / pmT) * 100).toFixed(0)}%)`, (d.cash / pmT) * 100);
  if (d.card > 0) drawBarRow(ctx, "Tarjeta", `${fmtEUR(d.card)} (${((d.card / pmT) * 100).toFixed(0)}%)`, (d.card / pmT) * 100);
  if (d.mixed > 0) drawBarRow(ctx, "Mixto", `${fmtEUR(d.mixed)} (${((d.mixed / pmT) * 100).toFixed(0)}%)`, (d.mixed / pmT) * 100);
  if (d.total <= 0) {
    ctx.doc.setFontSize(7.5);
    ctx.doc.setFont("helvetica", "italic");
    ctx.doc.setTextColor(...C.slate400);
    ctx.doc.text("Sin pagos registrados", ML + CW / 2, ctx.y + 3, { align: "center" });
    ctx.y += 8;
  }

  drawSectionTitle(ctx, "Reservas");
  drawKPIGrid(ctx, [
    { label: "Total", value: String(d.bookingsTotal), sub: `${d.bookingsCancelled} canceladas` },
    { label: "Vía Admin", value: String(d.bookingsCrm) },
    { label: "Vía Web", value: String(d.bookingsWeb) },
  ]);

  if (d.stylists.length > 0) {
    drawSectionTitle(ctx, "Top estilistas");
    drawTable(
      ctx,
      ["Profesional", "Servicios", "Ventas", "Ticket medio"],
      d.stylists.slice(0, 8).map((s: any) => [
        s.name,
        String(s.services),
        fmtEUR(s.sales),
        fmtEUR(s.count > 0 ? s.sales / s.count : 0),
      ]),
      [1, 2, 3]
    );
  }

  if (d.services.length > 0) {
    drawSectionTitle(ctx, "Top servicios");
    const svSlice = d.services.slice(0, 8);
    const maxRev = Math.max(...svSlice.map((s: any) => s.revenue), 1);
    svSlice.forEach((s: any) => {
      drawBarRow(ctx, s.name, `${fmtEUR(s.revenue)} · ${s.count}u`, (s.revenue / maxRev) * 100);
    });
  }
}

function buildProductivityPDF(ctx: PDFCtx, d: any): void {
  drawSectionTitle(ctx, "Resumen del equipo");
  drawKPIGrid(ctx, [
    { label: "Ingresos totales", value: fmtEUR(d.total), highlight: true },
    { label: "Servicios realizados", value: String(d.stylists.reduce((s: number, x: any) => s + x.services, 0)) },
    { label: "Propinas equipo", value: fmtEUR(d.tips) },
  ]);

  drawSectionTitle(ctx, "Detalle por profesional");
  if (d.stylists.length === 0) {
    ctx.doc.setFontSize(7.5);
    ctx.doc.setFont("helvetica", "italic");
    ctx.doc.setTextColor(...C.slate400);
    ctx.doc.text("Sin datos en el período", ML + CW / 2, ctx.y + 3, { align: "center" });
    ctx.y += 8;
  } else {
    drawTable(
      ctx,
      ["Profesional", "Transacciones", "Servicios", "Propinas", "Ventas", "Ticket medio"],
      d.stylists.map((s: any) => [
        s.name, String(s.count), String(s.services),
        fmtEUR(s.tips), fmtEUR(s.sales),
        fmtEUR(s.count > 0 ? s.sales / s.count : 0),
      ]),
      [1, 2, 3, 4, 5],
      [
        "TOTAL EQUIPO",
        String(d.stylists.reduce((s: number, x: any) => s + x.count, 0)),
        String(d.stylists.reduce((s: number, x: any) => s + x.services, 0)),
        fmtEUR(d.tips), fmtEUR(d.total),
        fmtEUR(d.txCount > 0 ? d.total / d.txCount : 0),
      ]
    );
  }

  if (d.stylists.length > 0) {
    drawSectionTitle(ctx, "Ranking visual");
    const maxSales = Math.max(...d.stylists.map((s: any) => s.sales), 1);
    d.stylists.forEach((s: any) => {
      drawBarRow(ctx, s.name, fmtEUR(s.sales), (s.sales / maxSales) * 100);
    });
  }
}

function buildServicesPDF(ctx: PDFCtx, d: any): void {
  drawSectionTitle(ctx, "Resumen catálogo");
  drawKPIGrid(ctx, [
    { label: "Ingresos por servicios", value: fmtEUR(d.services.reduce((s: number, x: any) => s + x.revenue, 0)), highlight: true },
    { label: "Servicios distintos", value: String(d.services.length) },
    { label: "Cantidad total", value: String(d.services.reduce((s: number, x: any) => s + x.count, 0)) },
  ]);

  const top = d.services.slice(0, 15);
  drawSectionTitle(ctx, "Top 15 servicios");
  if (top.length === 0) {
    ctx.doc.setFontSize(7.5);
    ctx.doc.setFont("helvetica", "italic");
    ctx.doc.setTextColor(...C.slate400);
    ctx.doc.text("Sin servicios en el período", ML + CW / 2, ctx.y + 3, { align: "center" });
    ctx.y += 8;
  } else {
    drawTable(
      ctx,
      ["#", "Servicio", "Cantidad", "Ingresos", "Precio medio"],
      top.map((s: any, i: number) => [
        String(i + 1), s.name, String(s.count),
        fmtEUR(s.revenue),
        fmtEUR(s.count > 0 ? s.revenue / s.count : 0),
      ]),
      [0, 2, 3, 4],
      [
        "",
        `TOTAL TOP ${top.length} SERVICIOS`,
        String(top.reduce((s: number, x: any) => s + x.count, 0)),
        fmtEUR(top.reduce((s: number, x: any) => s + x.revenue, 0)),
        fmtEUR(
          top.reduce((s: number, x: any) => s + x.count, 0) > 0
            ? top.reduce((s: number, x: any) => s + x.revenue, 0) / top.reduce((s: number, x: any) => s + x.count, 0)
            : 0
        ),
      ]
    );
  }

  if (d.services.length > 0) {
    drawSectionTitle(ctx, "Distribución de ingresos");
    const topBars = d.services.slice(0, 10);
    const maxRev = Math.max(...topBars.map((s: any) => s.revenue), 1);
    topBars.forEach((s: any) => {
      drawBarRow(ctx, s.name, `${fmtEUR(s.revenue)} · ${s.count}u`, (s.revenue / maxRev) * 100);
    });
  }
}

function buildFiscalPDF(ctx: PDFCtx, d: any): void {
  drawSectionTitle(ctx, "Totales del período");
  drawKPIGrid(ctx, [
    { label: "Total facturado", value: fmtEUR(d.total), sub: `${d.txCount} transacciones`, highlight: true },
    { label: "Base imponible (sin IVA)", value: fmtEUR(d.netSinIva), sub: "21% IVA estimado" },
    { label: "IVA estimado", value: fmtEUR(d.iva) },
  ]);

  drawSectionTitle(ctx, "Reparto por método de pago");
  drawKPIGrid(ctx, [
    { label: "Efectivo", value: fmtEUR(d.cash) },
    { label: "Tarjeta", value: fmtEUR(d.card) },
    { label: "Mixto / Otros", value: fmtEUR(d.mixed) },
  ]);

  ctx.doc.setFontSize(7);
  ctx.doc.setFont("helvetica", "normal");
  ctx.doc.setTextColor(...C.slate500);
  ctx.doc.text(`Propinas: ${fmtEUR(d.tips)} · Descuentos aplicados: ${fmtEUR(d.discounts)}`, ML + 2, ctx.y);
  ctx.y += 6;

  drawSectionTitle(ctx, "Desglose día a día");
  const activeDays = d.daily.filter((x: any) => x.count > 0);
  if (activeDays.length === 0) {
    ctx.doc.setFontSize(7.5);
    ctx.doc.setFont("helvetica", "italic");
    ctx.doc.setTextColor(...C.slate400);
    ctx.doc.text("Sin transacciones en el período", ML + CW / 2, ctx.y + 3, { align: "center" });
    ctx.y += 8;
  } else {
    drawTable(
      ctx,
      ["Fecha", "Tickets", "Efectivo", "Tarjeta", "Propinas", "Total"],
      activeDays.map((x: any) => [
        format(x.date, "EEE d MMM yyyy", { locale: es }),
        String(x.count), fmtEUR(x.cash), fmtEUR(x.card),
        fmtEUR(x.tips), fmtEUR(x.total),
      ]),
      [1, 2, 3, 4, 5],
      ["TOTAL", String(d.txCount), fmtEUR(d.cash), fmtEUR(d.card), fmtEUR(d.tips), fmtEUR(d.total)]
    );
  }

  ensureSpace(ctx, 8);
  ctx.doc.setFontSize(6.5);
  ctx.doc.setFont("helvetica", "italic");
  ctx.doc.setTextColor(...C.slate400);
  ctx.doc.text(
    "Nota: IVA calculado al 21% sobre el total facturado. Consulta con tu asesor el tipo aplicable a cada servicio.",
    ML + 2, ctx.y
  );
  ctx.y += 6;
}

// ============================================================
// MAIN DOWNLOAD FUNCTION
// ============================================================

export async function downloadReportPDF(type: ReportType, d: any): Promise<void> {
  const titleMap: Record<ReportType, string> = {
    monthly: "Resumen Ejecutivo de Negocio",
    productivity: "Productividad y Rendimiento del Equipo",
    services: "Catálogo y Rendimiento de Servicios",
    fiscal: "Informe Fiscal Oficial para Asesoría / IVA",
  };
  const fileNameMap: Record<ReportType, string> = {
    monthly: "Resumen_Ejecutivo",
    productivity: "Productividad_Equipo",
    services: "Rendimiento_Servicios",
    fiscal: "Informe_Fiscal",
  };

  const safeTenant = (d.tenantName || "Salon").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]/g, "_");
  const safeLabel = (d.rangeLabel || "Periodo").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `${fileNameMap[type] || "Informe"}_${safeTenant}_${safeLabel}.pdf`;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const ctx: PDFCtx = { doc, y: MT };

  drawHeader(ctx, d, titleMap[type]);

  if (type === "monthly") buildMonthlyPDF(ctx, d);
  else if (type === "productivity") buildProductivityPDF(ctx, d);
  else if (type === "services") buildServicesPDF(ctx, d);
  else if (type === "fiscal") buildFiscalPDF(ctx, d);

  drawFooter(ctx, d);
  doc.save(fileName);
}

// Legacy: keep for backward compatibility if needed elsewhere
export function openPrintReport(type: ReportType, data: any) {
  // Now just downloads PDF directly
  downloadReportPDF(type, data);
}

// Also export getReportParts and buildHTML for backward compat (CashReportsHub uses downloadReportPDF directly)
export function getReportParts(type: ReportType, d: any) {
  return { title: type, styles: "", header: "", body: "", footer: "" };
}

export function buildHTML(type: ReportType, d: any): string {
  return "";
}

// ============================================================
// REACT UI COMPONENT
// ============================================================

export function PDFReportsGenerator({ tenantId, tenantName = "Salón" }: PDFReportsGeneratorProps) {
  const [generating, setGenerating] = useState<ReportType | null>(null);
  const [rangeMode, setRangeMode] = useState<RangeMode>("month");
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [customFrom, setCustomFrom] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [customTo, setCustomTo] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const { toast } = useToast();

  const resolveRange = (): { start: Date; end: Date; label: string } => {
    const now = new Date();
    if (rangeMode === "month") {
      const [y, m] = selectedMonth.split("-").map(Number);
      const start = startOfMonth(new Date(y, m - 1));
      const end = endOfMonth(new Date(y, m - 1));
      return { start, end, label: format(start, "MMMM yyyy", { locale: es }) };
    }
    if (rangeMode === "quarter") {
      const start = startOfQuarter(now);
      const end = endOfQuarter(now);
      return {
        start,
        end,
        label: `Trimestre actual (${format(start, "MMM yyyy", { locale: es })} – ${format(end, "MMM yyyy", { locale: es })})`,
      };
    }
    if (rangeMode === "prev_quarter") {
      const ref = subQuarters(now, 1);
      const start = startOfQuarter(ref);
      const end = endOfQuarter(ref);
      return {
        start,
        end,
        label: `Trimestre anterior (${format(start, "MMM yyyy", { locale: es })} – ${format(end, "MMM yyyy", { locale: es })})`,
      };
    }
    // custom
    const start = parseISO(customFrom + "T00:00:00");
    const end = parseISO(customTo + "T23:59:59");
    return {
      start,
      end,
      label: `${format(start, "d MMM yyyy", { locale: es })} – ${format(end, "d MMM yyyy", { locale: es })}`,
    };
  };

  const generate = async (type: ReportType) => {
    setGenerating(type);
    try {
      const { start, end, label } = resolveRange();
      const data = await fetchReportData(tenantId, tenantName, start, end, label);
      await downloadReportPDF(type, data);
      toast({ title: "Informe descargado", description: "El archivo PDF se ha descargado en tu equipo." });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(null);
    }
  };

  // Opciones de mes (últimos 12 meses)
  const monthOptions = Array.from({ length: 12 }).map((_, i) => {
    const d = subMonths(new Date(), i);
    return { value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy", { locale: es }) };
  });

  const reports: { id: ReportType; title: string; desc: string; icon: React.ElementType }[] = [
    {
      id: "monthly",
      title: "Resumen ejecutivo",
      desc: "Todo en uno: KPIs, evolución, métodos de pago, top equipo y servicios.",
      icon: Sparkles,
    },
    {
      id: "productivity",
      title: "Productividad equipo",
      desc: "Detalle por profesional: ventas, servicios, propinas y ticket medio.",
      icon: Users,
    },
    {
      id: "services",
      title: "Catálogo y servicios",
      desc: "Top servicios, ingresos por servicio y oportunidades.",
      icon: TrendingUp,
    },
    {
      id: "fiscal",
      title: "Informe asesoría / fiscal",
      desc: "Desglose día a día: efectivo, tarjeta, IVA estimado. Para tu gestor.",
      icon: Receipt,
    },
  ];

  return (
    <div className="glow-card overflow-hidden">
      <div className="glow-card-h"><div>
        <h3>
          <FileText className="h-5 w-5" style={{ color: BRAND_PRIMARY }} />
          Informes PDF
        </h3>
        <div className="glow-card-h-sub">Informes listos para imprimir o enviar.</div>
      </div></div>
      <div className="glow-card-b">
        {/* Selector de período */}
        <div className="space-y-3">
          <label className="text-sm font-medium block">Período</label>
          <Select value={rangeMode} onValueChange={(v: RangeMode) => setRangeMode(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mes concreto</SelectItem>
              <SelectItem value="quarter">Trimestre actual</SelectItem>
              <SelectItem value="prev_quarter">Trimestre anterior</SelectItem>
              <SelectItem value="custom">Rango personalizado</SelectItem>
            </SelectContent>
          </Select>

          {rangeMode === "month" && (
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {rangeMode === "custom" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-outline">Desde</label>
                <input className="glow-input" type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
              </div>
              <div>
                <label className="text-[11px] text-outline">Hasta</label>
                <input className="glow-input" type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
              </div>
            </div>
          )}
        </div>

        {/* Plantillas */}
        <div className="grid gap-3 sm:grid-cols-2">
          {reports.map((r) => {
            const Icon = r.icon;
            const isLoading = generating === r.id;
            return (
              <button
                key={r.id}
                onClick={() => generate(r.id)}
                disabled={generating !== null}
                className="group text-left rounded-2xl border bg-card p-4 hover:border-primary/40 hover:shadow-md transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                    style={{ background: `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_ACCENT})` }}
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight">{r.title}</p>
                    <p className="text-[11px] text-outline mt-1 leading-snug">{r.desc}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-[11px] text-outline text-center">
          Descarga directa en formato PDF con texto seleccionable y diseño ejecutivo.
        </p>
      </div>
    </div>
  );
}
