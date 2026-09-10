import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfQuarter,
  endOfQuarter,
  subQuarters,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  FileSpreadsheet,
  FileText,
  Receipt,
  Sparkles,
  Users,
  TrendingUp,
  Loader2,
  Calendar,
  Banknote,
  CreditCard,
  Percent,
  CheckCircle2,
  Download,
  Printer,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  fetchReportData,
  downloadReportPDF,
  type ReportType,
} from "../PDFReportsGenerator";

interface CashReportsHubProps {
  tenantId: string;
}

type QuickPeriod = "this_month" | "last_month" | "current_quarter" | "last_quarter" | "custom";

const fmtEUR = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n || 0);

export function CashReportsHub({ tenantId }: CashReportsHubProps) {
  const { toast } = useToast();
  const [period, setPeriod] = useState<QuickPeriod>("this_month");
  const [customStart, setCustomStart] = useState<string>(
    format(startOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [customEnd, setCustomEnd] = useState<string>(
    format(endOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [tenantName, setTenantName] = useState<string>("Salón");
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  // Load tenant name
  useEffect(() => {
    supabase
      .from("tenants")
      .select("name")
      .eq("id", tenantId)
      .maybeSingle()
      .then(({ data: t }) => {
        if (t?.name) setTenantName(t.name);
      });
  }, [tenantId]);

  // Compute dates based on selected period
  const dateRange = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date;
    let label: string;

    if (period === "this_month") {
      start = startOfMonth(now);
      end = endOfMonth(now);
      label = format(start, "MMMM yyyy", { locale: es });
    } else if (period === "last_month") {
      const prev = subMonths(now, 1);
      start = startOfMonth(prev);
      end = endOfMonth(prev);
      label = format(start, "MMMM yyyy", { locale: es });
    } else if (period === "current_quarter") {
      start = startOfQuarter(now);
      end = endOfQuarter(now);
      label = `Trimestre actual (${format(start, "MMM yyyy", { locale: es })} – ${format(end, "MMM yyyy", { locale: es })})`;
    } else if (period === "last_quarter") {
      const prevQ = subQuarters(now, 1);
      start = startOfQuarter(prevQ);
      end = endOfQuarter(prevQ);
      label = `Trimestre anterior (${format(start, "MMM yyyy", { locale: es })} – ${format(end, "MMM yyyy", { locale: es })})`;
    } else {
      start = parseISO(customStart + "T00:00:00");
      end = parseISO(customEnd + "T23:59:59");
      label = `${format(start, "d MMM yyyy", { locale: es })} – ${format(end, "d MMM yyyy", { locale: es })}`;
    }

    return { start, end, label };
  }, [period, customStart, customEnd]);

  // Load report data whenever dateRange changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchReportData(tenantId, tenantName, dateRange.start, dateRange.end, dateRange.label)
      .then((res) => {
        if (!cancelled) {
          setData(res);
        }
      })
      .catch((err) => {
        console.error("Error loading report data:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tenantId, tenantName, dateRange]);

  // Handler: Generate and download PDF report directly without opening print dialog
  const handleGeneratePDF = async (type: ReportType) => {
    setActionLoading(type);
    try {
      const currentData =
        data ||
        (await fetchReportData(
          tenantId,
          tenantName,
          dateRange.start,
          dateRange.end,
          dateRange.label
        ));
      await downloadReportPDF(type, currentData);
      toast({
        title: "Informe descargado",
        description: "El archivo PDF se ha descargado correctamente en tu equipo.",
      });
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Error al descargar informe",
        description: e.message || "Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handler: Export directly to Excel / CSV formatted as an official GlowApp accounting workbook
  const handleExportExcel = () => {
    if (!data || !data.rawTransactions || data.rawTransactions.length === 0) {
      toast({
        title: "Sin operaciones",
        description: "No hay transacciones registradas en este período.",
        variant: "destructive",
      });
      return;
    }

    setActionLoading("excel");
    try {
      const transactions = data.rawTransactions;
      const fmtMoney = (val: any) => (Number(val) || 0).toFixed(2).replace(".", ",");
      const safeLabel = (dateRange.label || "Periodo").replace(/[^a-zA-Z0-9_-]/g, "_");
      const safeTenant = (tenantName || "Salon").replace(/[^a-zA-Z0-9_-]/g, "_");

      const escapeCSV = (val: any) => {
        const str = String(val ?? "");
        if (str.startsWith("=")) return str;
        if (str.includes(";") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      // 1. GlowApp Business Official Accounting Header
      const lines: string[][] = [
        ["GLOWAPP BUSINESS · LIBRO DIARIO DE CAJA Y FACTURACIÓN"],
        ["Salón / Empresa:", tenantName],
        ["Período contable:", dateRange.label],
        ["Fecha y hora de emisión:", format(new Date(), "dd/MM/yyyy HH:mm")],
        ["Moneda:", "EUR (€)"],
        ["Régimen fiscal:", "21% IVA incluido"],
        [],
        // 2. Executive Financial Summary
        ["RESUMEN FINANCIERO DEL PERÍODO"],
        ["Concepto", "Importe (€)", "Notas / Detalle"],
        ["Total Facturado", fmtMoney(data.total), `${data.txCount} transacciones en el período`],
        ["Cobros con Tarjeta", fmtMoney(data.card), "TPV físico / Pasarela online"],
        ["Cobros en Efectivo", fmtMoney(data.cash), "Caja física del salón"],
        ["Cobros Mixtos / Otros", fmtMoney(data.mixed), ""],
        ["Base Imponible Estimada (21%)", fmtMoney(data.netSinIva), "Cálculo: Total / 1,21"],
        ["Cuota IVA Estimada (21%)", fmtMoney(data.iva), "Cálculo: Total - Base Imponible"],
        ["Total Propinas Registradas", fmtMoney(data.tips), "No computa para IVA"],
        ["Total Descuentos Aplicados", fmtMoney(data.discounts), ""],
        [],
        // 3. Detailed movements ledger
        ["DETALLE CRONOLÓGICO DE MOVIMIENTOS DE CAJA"],
        [
          "Fecha",
          "Hora",
          "Nº Operación",
          "Cliente",
          "Estilista",
          "Concepto / Servicios",
          "Método de Pago",
          "Tarjeta (€)",
          "Efectivo (€)",
          "Propinas (€)",
          "Descuento (€)",
          "Base Imponible (€)",
          "Cuota IVA (€)",
          "Total Ticket (€)",
        ],
      ];

      // Row indices for Excel formula calculation (1-indexed in Excel)
      const dataStartRow = lines.length + 1;

      transactions.forEach((tx: any, idx: number) => {
        const d = new Date(tx.created_at);
        const cardVal = tx.payment_method === "card" ? Number(tx.total || 0) : 0;
        const cashVal = tx.payment_method === "cash" ? Number(tx.total || 0) : 0;
        const totalVal = Number(tx.total || 0);
        const netVal = totalVal / 1.21;
        const ivaVal = totalVal - netVal;

        const servicesStr = Array.isArray(tx.services) && tx.services.length > 0
          ? tx.services.map((s: any) => s.name || "Servicio").join(" + ")
          : "Servicio de salón";

        lines.push([
          format(d, "dd/MM/yyyy"),
          format(d, "HH:mm"),
          `TX-${String(idx + 1).padStart(4, "0")}`,
          tx.customer_name || "Cliente ocasional",
          tx.stylist || "Equipo",
          servicesStr,
          tx.payment_method === "card" ? "Tarjeta" : tx.payment_method === "cash" ? "Efectivo" : "Mixto",
          fmtMoney(cardVal),
          fmtMoney(cashVal),
          fmtMoney(tx.tip_amount),
          fmtMoney(tx.discount),
          fmtMoney(netVal),
          fmtMoney(ivaVal),
          fmtMoney(totalVal),
        ]);
      });

      const dataEndRow = dataStartRow + transactions.length - 1;

      // Active sum formulas row
      lines.push([]);
      lines.push([
        "TOTALES DEL PERÍODO",
        "",
        "",
        "",
        "",
        "",
        "",
        `=SUMA(H${dataStartRow}:H${dataEndRow})`,
        `=SUMA(I${dataStartRow}:I${dataEndRow})`,
        `=SUMA(J${dataStartRow}:J${dataEndRow})`,
        `=SUMA(K${dataStartRow}:K${dataEndRow})`,
        `=SUMA(L${dataStartRow}:L${dataEndRow})`,
        `=SUMA(M${dataStartRow}:M${dataEndRow})`,
        `=SUMA(N${dataStartRow}:N${dataEndRow})`,
      ]);

      const csvContent = lines
        .map((row) => row.map((cell) => escapeCSV(cell)).join(";"))
        .join("\r\n");

      // UTF-8 BOM for Microsoft Excel
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `GlowApp_Contabilidad_${safeTenant}_${safeLabel}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Excel descargado",
        description: `Libro contable GlowApp para ${dateRange.label} con fórmulas de suma automáticas.`,
      });
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Error al exportar",
        description: e.message || "Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground m-0">
              Informes y Fiscalidad de Caja
            </h2>
            <Badge variant="secondary" className="text-[11px] font-semibold bg-primary/10 text-primary border-none">
              Gestoría & Cierres
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Descarga en un clic los informes oficiales para tu asesoría (PDF fiscal e IVA, Excel de cobros) y resúmenes ejecutivos
          </p>
        </div>
      </div>

      {/* ── Quick Period Selector Bar ── */}
      <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            Período a consultar:
          </span>
          <span className="text-xs font-bold text-foreground capitalize">
            {dateRange.label}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          {(
            [
              { id: "this_month", label: "Este Mes" },
              { id: "last_month", label: "Mes Anterior" },
              { id: "current_quarter", label: "Trimestre Actual" },
              { id: "last_quarter", label: "Trimestre Anterior" },
              { id: "custom", label: "Personalizado" },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={cn(
                "py-2 px-3 rounded-xl border text-center transition-all cursor-pointer text-xs font-semibold",
                period === p.id
                  ? "bg-primary/10 border-primary text-primary font-bold shadow-xs ring-1 ring-primary/20"
                  : "bg-muted/30 border-border/60 hover:bg-muted/60 text-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom Range Inputs (if selected) */}
        {period === "custom" && (
          <div className="pt-2 border-t border-border/40 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                Fecha inicio:
              </label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-background border border-border text-foreground"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                Fecha fin:
              </label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-background border border-border text-foreground"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Live Period Financial KPIs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-card border border-border/70 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-muted-foreground">Total Cobrado</div>
          <div className="text-xl font-black text-foreground tracking-tight">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : fmtEUR(data?.total || 0)}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {data?.txCount || 0} {data?.txCount === 1 ? "cobro registrado" : "cobros registrados"}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-border/70 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
            <CreditCard className="w-3 h-3 text-info" />
            Tarjeta
          </div>
          <div className="text-xl font-black text-foreground tracking-tight">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : fmtEUR(data?.card || 0)}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {data?.total > 0 ? `${Math.round(((data?.card || 0) / data.total) * 100)}% del total` : "0%"}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-border/70 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
            <Banknote className="w-3 h-3 text-emerald-600" />
            Efectivo
          </div>
          <div className="text-xl font-black text-foreground tracking-tight">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : fmtEUR(data?.cash || 0)}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {data?.total > 0 ? `${Math.round(((data?.cash || 0) / data.total) * 100)}% del total` : "0%"}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-border/70 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
            <Percent className="w-3 h-3 text-purple-600" />
            IVA 21% Estimado
          </div>
          <div className="text-xl font-black text-foreground tracking-tight">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : fmtEUR(data?.iva || 0)}
          </div>
          <div className="text-[10px] text-muted-foreground">
            Base: {fmtEUR(data?.netSinIva || 0)}
          </div>
        </div>
      </div>

      {/* ── Section 1: Para tu Gestoría / Asesoría (HERO CARDS) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2 m-0">
            <Receipt className="w-4 h-4 text-primary" />
            Para tu Gestoría / Trimestre
          </h3>
          <span className="text-[11px] text-muted-foreground">
            Los dos informes oficiales que te pide tu contable
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card A: Fiscal PDF */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-primary/5 via-card to-card border-2 border-primary/30 shadow-sm flex flex-col justify-between space-y-4 hover:border-primary/50 transition-all">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-primary border-primary/30">
                  Formato Oficial PDF
                </Badge>
              </div>

              <div>
                <h4 className="text-base font-bold text-foreground m-0">
                  Informe Fiscal y Resumen de IVA
                </h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Desglose día a día de facturación, Base Imponible, cuota de IVA al 21% y totales separados de pagos en tarjeta y efectivo. Ideal para declaraciones trimestrales o cierre de mes.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground pt-1">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Base + IVA 21%
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Cobros Tarjeta vs Efectivo
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Descarga directa en PDF
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleGeneratePDF("fiscal")}
              disabled={actionLoading !== null}
              className="glow-btn glow-btn--primary w-full justify-center py-2.5 cursor-pointer shadow-sm font-bold text-xs"
            >
              {actionLoading === "fiscal" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Descargando PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Descargar Informe Fiscal PDF</span>
                </>
              )}
            </button>
          </div>

          {/* Card B: Excel / CSV */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/5 via-card to-card border-2 border-emerald-500/30 shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-500/50 transition-all">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 border-emerald-500/30">
                  Excel / CSV con Fórmulas
                </Badge>
              </div>

              <div>
                <h4 className="text-base font-bold text-foreground m-0">
                  Exportación de Movimientos para Asesoría
                </h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Archivo `.csv` compatible con Excel con el detalle completo de cada transacción: fecha/hora, cliente, estilista, método de pago, propinas, descuentos y fórmulas de suma automáticas.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground pt-1">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Fórmulas =SUMA() integradas
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Formato numérico español
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Descarga instantánea
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={actionLoading !== null}
              className="glow-btn glow-btn--outline w-full justify-center py-2.5 cursor-pointer text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/10 font-bold text-xs"
            >
              {actionLoading === "excel" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Preparando archivo...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Descargar Excel / CSV del Período</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Section 2: Informes de Gestión y Negocio (PDF) ── */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2 m-0">
            <Sparkles className="w-4 h-4 text-primary" />
            Informes de Gestión y Rendimiento
          </h3>
          <span className="text-[11px] text-muted-foreground">
            Documentos analíticos en PDF para el salón
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Monthly / Executive Summary */}
          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between space-y-3 hover:border-border transition-all">
            <div className="space-y-1.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-foreground m-0">
                Resumen Ejecutivo
              </h4>
              <p className="text-[11px] text-muted-foreground leading-snug">
                KPIs globales, evolución de ventas, comparativa con período anterior, evolución de reservas y métodos de cobro.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleGeneratePDF("monthly")}
              disabled={actionLoading !== null}
              className="glow-btn glow-btn--sm glow-btn--outline w-full justify-between cursor-pointer text-xs"
            >
              {actionLoading === "monthly" ? (
                <>
                  <span>Descargando...</span>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                </>
              ) : (
                <>
                  <span>Descargar Resumen PDF</span>
                  <Download className="w-3.5 h-3.5 text-muted-foreground" />
                </>
              )}
            </button>
          </div>

          {/* Team Productivity */}
          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between space-y-3 hover:border-border transition-all">
            <div className="space-y-1.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-foreground m-0">
                Productividad del Equipo
              </h4>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Facturación por estilista, servicios realizados, ticket medio y propinas acumuladas por cada profesional.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleGeneratePDF("productivity")}
              disabled={actionLoading !== null}
              className="glow-btn glow-btn--sm glow-btn--outline w-full justify-between cursor-pointer text-xs"
            >
              {actionLoading === "productivity" ? (
                <>
                  <span>Descargando...</span>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                </>
              ) : (
                <>
                  <span>Descargar Productividad PDF</span>
                  <Download className="w-3.5 h-3.5 text-muted-foreground" />
                </>
              )}
            </button>
          </div>

          {/* Services Performance */}
          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between space-y-3 hover:border-border transition-all">
            <div className="space-y-1.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-foreground m-0">
                Rendimiento de Servicios
              </h4>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Ranking de servicios más rentables y solicitados, facturación por categoría y oportunidades de catálogo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleGeneratePDF("services")}
              disabled={actionLoading !== null}
              className="glow-btn glow-btn--sm glow-btn--outline w-full justify-between cursor-pointer text-xs"
            >
              {actionLoading === "services" ? (
                <>
                  <span>Descargando...</span>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                </>
              ) : (
                <>
                  <span>Descargar Servicios PDF</span>
                  <Download className="w-3.5 h-3.5 text-muted-foreground" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
