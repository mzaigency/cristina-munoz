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

interface PDFReportsGeneratorProps {
  tenantId: string;
  tenantName?: string;
}

type ReportType = "monthly" | "productivity" | "services" | "fiscal";
type RangeMode = "month" | "quarter" | "prev_quarter" | "custom";

const BRAND_PRIMARY = "#22408C";  // = --glow-brand
const BRAND_ACCENT = "#98329A";  // = --glow-accent

const fmtEUR = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n || 0);

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
      const startISO = start.toISOString();
      const endISO = end.toISOString();

      // Comparativa: período inmediatamente anterior, misma duración
      const durMs = end.getTime() - start.getTime();
      const prevEnd = new Date(start.getTime() - 1);
      const prevStart = new Date(start.getTime() - durMs - 1);

      const [{ data: tx }, { data: prevTx }, { data: bookings }] = await Promise.all([
        supabase
          .from("transactions")
          .select("total, payment_method, tip_amount, discount, stylist, stylist_id, services, created_at")
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

      const data = {
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

      const html = buildHTML(type, data);
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(html);
        win.document.close();
        win.onload = () => setTimeout(() => win.print(), 350);
      }

      toast({ title: "Informe generado", description: "Listo para imprimir o guardar como PDF" });
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
          Los informes se abren en una nueva ventana. Imprime o guarda como PDF desde el diálogo del navegador.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// HTML GENERATION
// ============================================================

function buildHTML(type: ReportType, d: any): string {
  const titleMap: Record<ReportType, string> = {
    monthly: "Resumen ejecutivo",
    productivity: "Productividad del equipo",
    services: "Catálogo y servicios",
    fiscal: "Informe para asesoría",
  };

  const styles = `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        color: #131520; background: #fff; padding: 32px 36px; line-height: 1.5;
        -webkit-font-smoothing: antialiased;
      }
      .header {
        display: flex; justify-content: space-between; align-items: flex-start;
        padding-bottom: 20px; margin-bottom: 28px;
        border-bottom: 3px solid transparent;
        border-image: linear-gradient(90deg, ${BRAND_PRIMARY}, ${BRAND_ACCENT}) 1;
      }
      .brand-mark {
        font-size: 11px; font-weight: 700; letter-spacing: 2px;
        color: ${BRAND_PRIMARY}; text-transform: uppercase; margin-bottom: 6px;
      }
      .salon-name { font-size: 26px; font-weight: 800; color: #131520; letter-spacing: -0.5px; }
      .report-type { font-size: 13px; color: #676B7E; margin-top: 4px; font-weight: 500; }
      .meta-right { text-align: right; font-size: 11px; color: #676B7E; line-height: 1.6; }
      .meta-right strong { color: #1e293b; }

      .section { margin-top: 32px; page-break-inside: avoid; }
      .section-title {
        font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;
        color: ${BRAND_PRIMARY}; margin-bottom: 12px;
        display: flex; align-items: center; gap: 8px;
      }
      .section-title::before {
        content: ''; width: 4px; height: 14px; border-radius: 2px;
        background: linear-gradient(180deg, ${BRAND_PRIMARY}, ${BRAND_ACCENT});
      }

      .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
      .kpi-grid.cols-3 { grid-template-columns: repeat(3, 1fr); }
      .kpi-card {
        background: #f8fafc; border: 1px solid #E4E6EF; border-radius: 14px;
        padding: 16px; position: relative; overflow: hidden;
      }
      .kpi-card.highlight {
        background: linear-gradient(135deg, ${BRAND_PRIMARY} 0%, ${BRAND_ACCENT} 100%);
        color: #fff; border-color: transparent;
      }
      .kpi-card.highlight .kpi-label, .kpi-card.highlight .kpi-sub { color: rgba(255,255,255,0.85); }
      .kpi-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #676B7E; }
      .kpi-value { font-size: 22px; font-weight: 800; margin-top: 6px; color: #131520; letter-spacing: -0.5px; }
      .kpi-card.highlight .kpi-value { color: #fff; }
      .kpi-sub { font-size: 10px; color: #9DA1B2; margin-top: 4px; }

      .growth-badge {
        display: inline-block; padding: 3px 10px; border-radius: 999px;
        font-size: 11px; font-weight: 600; margin-top: 6px;
      }
      .growth-up { background: #d1fae5; color: #065f46; }
      .growth-down { background: #fee2e2; color: #991b1b; }

      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      thead th {
        background: linear-gradient(90deg, ${BRAND_PRIMARY}, ${BRAND_ACCENT});
        color: #fff; padding: 10px 12px; text-align: left;
        font-size: 10px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;
      }
      thead th:first-child { border-radius: 8px 0 0 8px; }
      thead th:last-child { border-radius: 0 8px 8px 0; }
      tbody td { padding: 10px 12px; border-bottom: 1px solid #F2F3F8; }
      tbody tr:last-child td { border-bottom: none; }
      tbody tr:nth-child(even) { background: #fafbfc; }
      .num { text-align: right; font-variant-numeric: tabular-nums; }

      .bar-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; font-size: 12px; }
      .bar-label { flex: 0 0 140px; font-weight: 500; color: #334155; }
      .bar-track { flex: 1; height: 10px; background: #F2F3F8; border-radius: 999px; overflow: hidden; }
      .bar-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, ${BRAND_PRIMARY}, ${BRAND_ACCENT}); }
      .bar-value { flex: 0 0 110px; text-align: right; font-weight: 600; color: #131520; font-variant-numeric: tabular-nums; }

      .sparkline-card {
        background: #f8fafc; border: 1px solid #E4E6EF; border-radius: 14px;
        padding: 20px; margin-top: 12px;
      }

      .footer {
        margin-top: 40px; padding-top: 16px; border-top: 1px solid #E4E6EF;
        text-align: center; font-size: 10px; color: #9DA1B2;
      }
      .footer strong { color: ${BRAND_PRIMARY}; font-weight: 700; }

      .empty { color: #9DA1B2; font-style: italic; padding: 20px; text-align: center; font-size: 12px; }

      @media print {
        body { padding: 18mm 16mm; }
        @page { size: A4; margin: 0; }
        .section { page-break-inside: avoid; }
        .kpi-card.highlight { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        thead th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .bar-fill { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    </style>
  `;

  const header = `
    <div class="header">
      <div>
        <div class="brand-mark">GlowApp · Informe</div>
        <div class="salon-name">${escapeHtml(d.tenantName)}</div>
        <div class="report-type">${titleMap[type]} · ${escapeHtml(d.rangeLabel)}</div>
      </div>
      <div class="meta-right">
        <div>Generado el</div>
        <div><strong>${d.generatedAt}</strong></div>
      </div>
    </div>
  `;

  const footer = `
    <div class="footer">
      Generado con <strong>GlowApp</strong> · glowapp.app · Datos confidenciales del negocio
    </div>
  `;

  let body = "";
  if (type === "monthly") body = renderMonthly(d);
  else if (type === "productivity") body = renderProductivity(d);
  else if (type === "services") body = renderServices(d);
  else if (type === "fiscal") body = renderFiscal(d);

  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>${titleMap[type]} - ${escapeHtml(d.tenantName)}</title>${styles}</head><body>${header}${body}${footer}</body></html>`;
}

function renderMonthly(d: any) {
  return `
    <div class="section">
      <div class="section-title">Indicadores clave</div>
      <div class="kpi-grid">
        <div class="kpi-card highlight">
          <div class="kpi-label">Ingresos</div>
          <div class="kpi-value">${fmtEUR(d.total)}</div>
          ${renderGrowth(d.growth)}
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Transacciones</div>
          <div class="kpi-value">${d.txCount}</div>
          <div class="kpi-sub">vs. ${fmtEUR(d.prevTotal)} anterior</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Ticket medio</div>
          <div class="kpi-value">${fmtEUR(d.avg)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Propinas</div>
          <div class="kpi-value">${fmtEUR(d.tips)}</div>
          <div class="kpi-sub">Descuentos: ${fmtEUR(d.discounts)}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Evolución diaria</div>
      <div class="sparkline-card">
        ${renderSparkline(d.daily)}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Métodos de pago</div>
      ${renderPaymentBars(d.cash, d.card, d.mixed, d.total)}
    </div>

    <div class="section">
      <div class="section-title">Reservas</div>
      <div class="kpi-grid cols-3">
        <div class="kpi-card">
          <div class="kpi-label">Total</div>
          <div class="kpi-value">${d.bookingsTotal}</div>
          <div class="kpi-sub">${d.bookingsCancelled} canceladas</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Vía Admin</div>
          <div class="kpi-value">${d.bookingsCrm}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Vía Web</div>
          <div class="kpi-value">${d.bookingsWeb}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Top estilistas</div>
      ${renderStylistTable(d.stylists.slice(0, 8))}
    </div>

    <div class="section">
      <div class="section-title">Top servicios</div>
      ${renderServiceBars(d.services.slice(0, 8))}
    </div>
  `;
}

function renderProductivity(d: any) {
  return `
    <div class="section">
      <div class="section-title">Resumen del equipo</div>
      <div class="kpi-grid cols-3">
        <div class="kpi-card highlight">
          <div class="kpi-label">Ingresos totales</div>
          <div class="kpi-value">${fmtEUR(d.total)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Servicios realizados</div>
          <div class="kpi-value">${d.stylists.reduce((s: number, x: any) => s + x.services, 0)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Propinas equipo</div>
          <div class="kpi-value">${fmtEUR(d.tips)}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Detalle por profesional</div>
      ${
        d.stylists.length === 0
          ? `<div class="empty">Sin datos en el período</div>`
          : `
      <table>
        <thead>
          <tr>
            <th>Profesional</th>
            <th class="num">Transacciones</th>
            <th class="num">Servicios</th>
            <th class="num">Propinas</th>
            <th class="num">Ventas</th>
            <th class="num">Ticket medio</th>
          </tr>
        </thead>
        <tbody>
          ${d.stylists
            .map(
              (s: any) => `
            <tr>
              <td><strong>${escapeHtml(s.name)}</strong></td>
              <td class="num">${s.count}</td>
              <td class="num">${s.services}</td>
              <td class="num">${fmtEUR(s.tips)}</td>
              <td class="num"><strong>${fmtEUR(s.sales)}</strong></td>
              <td class="num">${fmtEUR(s.count > 0 ? s.sales / s.count : 0)}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>`
      }
    </div>

    <div class="section">
      <div class="section-title">Ranking visual</div>
      ${renderStylistBars(d.stylists)}
    </div>
  `;
}

function renderServices(d: any) {
  const top = d.services.slice(0, 15);
  return `
    <div class="section">
      <div class="section-title">Resumen catálogo</div>
      <div class="kpi-grid cols-3">
        <div class="kpi-card highlight">
          <div class="kpi-label">Ingresos por servicios</div>
          <div class="kpi-value">${fmtEUR(d.services.reduce((s: number, x: any) => s + x.revenue, 0))}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Servicios distintos</div>
          <div class="kpi-value">${d.services.length}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Cantidad total</div>
          <div class="kpi-value">${d.services.reduce((s: number, x: any) => s + x.count, 0)}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Top 15 servicios</div>
      ${
        top.length === 0
          ? `<div class="empty">Sin servicios en el período</div>`
          : `
      <table>
        <thead>
          <tr>
            <th style="width: 40px">#</th>
            <th>Servicio</th>
            <th class="num">Cantidad</th>
            <th class="num">Ingresos</th>
            <th class="num">Precio medio</th>
          </tr>
        </thead>
        <tbody>
          ${top
            .map(
              (s: any, i: number) => `
            <tr>
              <td>${i + 1}</td>
              <td><strong>${escapeHtml(s.name)}</strong></td>
              <td class="num">${s.count}</td>
              <td class="num"><strong>${fmtEUR(s.revenue)}</strong></td>
              <td class="num">${fmtEUR(s.count > 0 ? s.revenue / s.count : 0)}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>`
      }
    </div>

    <div class="section">
      <div class="section-title">Distribución de ingresos</div>
      ${renderServiceBars(top.slice(0, 10))}
    </div>
  `;
}

function renderFiscal(d: any) {
  return `
    <div class="section">
      <div class="section-title">Totales del período</div>
      <div class="kpi-grid cols-3">
        <div class="kpi-card highlight">
          <div class="kpi-label">Total facturado</div>
          <div class="kpi-value">${fmtEUR(d.total)}</div>
          <div class="kpi-sub">${d.txCount} transacciones</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Base imponible (sin IVA)</div>
          <div class="kpi-value">${fmtEUR(d.netSinIva)}</div>
          <div class="kpi-sub">21% IVA estimado</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">IVA estimado</div>
          <div class="kpi-value">${fmtEUR(d.iva)}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Reparto por método de pago</div>
      <div class="kpi-grid cols-3">
        <div class="kpi-card">
          <div class="kpi-label">Efectivo</div>
          <div class="kpi-value">${fmtEUR(d.cash)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Tarjeta</div>
          <div class="kpi-value">${fmtEUR(d.card)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Mixto / Otros</div>
          <div class="kpi-value">${fmtEUR(d.mixed)}</div>
        </div>
      </div>
      <p style="margin-top:10px; font-size:11px; color:#676B7E">
        Propinas: <strong>${fmtEUR(d.tips)}</strong> · Descuentos aplicados: <strong>${fmtEUR(d.discounts)}</strong>
      </p>
    </div>

    <div class="section">
      <div class="section-title">Desglose día a día</div>
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th class="num">Tickets</th>
            <th class="num">Efectivo</th>
            <th class="num">Tarjeta</th>
            <th class="num">Propinas</th>
            <th class="num">Total</th>
          </tr>
        </thead>
        <tbody>
          ${d.daily
            .filter((x: any) => x.count > 0)
            .map(
              (x: any) => `
            <tr>
              <td>${format(x.date, "EEE d MMM yyyy", { locale: es })}</td>
              <td class="num">${x.count}</td>
              <td class="num">${fmtEUR(x.cash)}</td>
              <td class="num">${fmtEUR(x.card)}</td>
              <td class="num">${fmtEUR(x.tips)}</td>
              <td class="num"><strong>${fmtEUR(x.total)}</strong></td>
            </tr>
          `,
            )
            .join("")}
          <tr style="background: #F2F3F8">
            <td><strong>TOTAL</strong></td>
            <td class="num"><strong>${d.txCount}</strong></td>
            <td class="num"><strong>${fmtEUR(d.cash)}</strong></td>
            <td class="num"><strong>${fmtEUR(d.card)}</strong></td>
            <td class="num"><strong>${fmtEUR(d.tips)}</strong></td>
            <td class="num"><strong>${fmtEUR(d.total)}</strong></td>
          </tr>
        </tbody>
      </table>
      <p style="margin-top:12px; font-size:10px; color:#9DA1B2; font-style: italic;">
        Nota: IVA calculado al 21% sobre el total facturado. Consulta con tu asesor el tipo aplicable a cada servicio.
      </p>
    </div>
  `;
}

function renderGrowth(growth: number) {
  if (!isFinite(growth) || growth === 0) return "";
  const up = growth > 0;
  return `<div class="growth-badge ${up ? "growth-up" : "growth-down"}">${up ? "↑" : "↓"} ${Math.abs(growth).toFixed(1)}%</div>`;
}

function renderPaymentBars(cash: number, card: number, mixed: number, total: number) {
  if (total <= 0) return `<div class="empty">Sin pagos registrados</div>`;
  const rows: { label: string; value: number }[] = [
    { label: "Efectivo", value: cash },
    { label: "Tarjeta", value: card },
    { label: "Mixto", value: mixed },
  ].filter((r) => r.value > 0);
  return rows
    .map((r) => {
      const pct = (r.value / total) * 100;
      return `
      <div class="bar-row">
        <div class="bar-label">${r.label}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
        <div class="bar-value">${fmtEUR(r.value)} (${pct.toFixed(0)}%)</div>
      </div>
    `;
    })
    .join("");
}

function renderStylistTable(stylists: any[]) {
  if (stylists.length === 0) return `<div class="empty">Sin datos</div>`;
  return `
    <table>
      <thead>
        <tr>
          <th>Profesional</th>
          <th class="num">Servicios</th>
          <th class="num">Ventas</th>
          <th class="num">Ticket medio</th>
        </tr>
      </thead>
      <tbody>
        ${stylists
          .map(
            (s) => `
          <tr>
            <td><strong>${escapeHtml(s.name)}</strong></td>
            <td class="num">${s.services}</td>
            <td class="num"><strong>${fmtEUR(s.sales)}</strong></td>
            <td class="num">${fmtEUR(s.count > 0 ? s.sales / s.count : 0)}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderStylistBars(stylists: any[]) {
  if (stylists.length === 0) return `<div class="empty">Sin datos</div>`;
  const max = Math.max(...stylists.map((s) => s.sales), 1);
  return stylists
    .map(
      (s) => `
    <div class="bar-row">
      <div class="bar-label">${escapeHtml(s.name)}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${(s.sales / max) * 100}%"></div></div>
      <div class="bar-value">${fmtEUR(s.sales)}</div>
    </div>
  `,
    )
    .join("");
}

function renderServiceBars(services: any[]) {
  if (services.length === 0) return `<div class="empty">Sin servicios</div>`;
  const max = Math.max(...services.map((s) => s.revenue), 1);
  return services
    .map(
      (s) => `
    <div class="bar-row">
      <div class="bar-label">${escapeHtml(s.name)}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${(s.revenue / max) * 100}%"></div></div>
      <div class="bar-value">${fmtEUR(s.revenue)} · ${s.count}u</div>
    </div>
  `,
    )
    .join("");
}

function renderSparkline(daily: any[]) {
  if (!daily.length) return `<div class="empty">Sin datos</div>`;
  const W = 640,
    H = 120,
    P = 10;
  const max = Math.max(...daily.map((d) => d.total), 1);
  const stepX = (W - P * 2) / Math.max(daily.length - 1, 1);
  const points = daily.map((d, i) => {
    const x = P + i * stepX;
    const y = H - P - (d.total / max) * (H - P * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const path = "M " + points.join(" L ");
  const area = `M ${P},${H - P} L ` + points.join(" L ") + ` L ${P + (daily.length - 1) * stepX},${H - P} Z`;
  const maxIdx = daily.reduce((best, d, i) => (d.total > daily[best].total ? i : best), 0);
  const maxDay = daily[maxIdx];
  const total = daily.reduce((s, d) => s + d.total, 0);
  return `
    <svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${BRAND_PRIMARY}" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="${BRAND_ACCENT}" stop-opacity="0.02"/>
        </linearGradient>
        <linearGradient id="sparkStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="${BRAND_PRIMARY}"/>
          <stop offset="100%" stop-color="${BRAND_ACCENT}"/>
        </linearGradient>
      </defs>
      <path d="${area}" fill="url(#sparkFill)" />
      <path d="${path}" fill="none" stroke="url(#sparkStroke)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
    </svg>
    <div style="display:flex; justify-content: space-between; margin-top: 10px; font-size: 11px; color: #676B7E;">
      <span>${format(daily[0].date, "d MMM", { locale: es })}</span>
      <span>Mejor día: <strong style="color:${BRAND_PRIMARY}">${format(maxDay.date, "d MMM", { locale: es })}</strong> · ${fmtEUR(maxDay.total)}</span>
      <span>Total: <strong style="color:#131520">${fmtEUR(total)}</strong></span>
    </div>
  `;
}

function escapeHtml(s: string): string {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
