import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Download, Loader2, FileSpreadsheet } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";

interface ExportDataProps {
  tenantId: string;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  fontSize: 13.5,
  fontWeight: 500,
  background: "var(--gp-chip)",
  border: "1.5px solid var(--gp-line2)",
  borderRadius: 10,
  color: "var(--gp-fg)",
  outline: "none",
  boxSizing: "border-box",
};

export const ExportData = ({ tenantId }: ExportDataProps) => {
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const { toast } = useToast();

  const exportToCSV = async () => {
    if (!startDate || !endDate) {
      toast({ title: "Selecciona un período", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("voided", false)
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (!transactions || transactions.length === 0) {
        toast({ title: "No hay datos", variant: "destructive" });
        setLoading(false);
        return;
      }

      const headers = ["Fecha y Hora", "Importe Tarjeta", "Importe Efectivo", "Descuento", "Propinas"];
      const fmtMoney = (amount: any) => (amount || 0).toFixed(2).replace(".", ",");

      const rows = transactions.map((tx) => {
        const date = new Date(tx.created_at);
        let cardAmount = 0;
        let cashAmount = 0;
        const total = Number(tx.total || 0);
        if (tx.payment_method === "card") cardAmount = total;
        else if (tx.payment_method === "cash") cashAmount = total;
        return [
          format(date, "dd/MM/yyyy HH:mm"),
          fmtMoney(cardAmount),
          fmtMoney(cashAmount),
          fmtMoney(tx.discount),
          fmtMoney(tx.tip_amount),
        ];
      });

      const dataStartRow = 2;
      const dataEndRow = dataStartRow + transactions.length - 1;
      rows.push([]);
      const totalRowIndex = dataEndRow + 2;
      rows.push([
        "TOTALES",
        `=SUMA(B${dataStartRow}:B${dataEndRow})`,
        `=SUMA(C${dataStartRow}:C${dataEndRow})`,
        `=SUMA(D${dataStartRow}:D${dataEndRow})`,
        `=SUMA(E${dataStartRow}:E${dataEndRow})`,
      ]);
      rows.push([]);
      rows.push(["TOTAL GENERAL", "", `=B${totalRowIndex}+C${totalRowIndex}+E${totalRowIndex}-D${totalRowIndex}`, "", ""]);

      const escapeCSV = (val: string) => {
        if (typeof val === "string" && val.startsWith("=")) return val;
        if (val.includes(";") || val.includes('"') || val.includes("\n")) return `"${val.replace(/"/g, '""')}"`;
        return val;
      };

      const csvContent = [
        headers.join(";"),
        ...rows.map((row) => row.map((cell) => escapeCSV(String(cell))).join(";")),
      ].join("\n");

      const BOM = "﻿";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Contabilidad_${startDate}_${endDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: "Excel generado", description: "Fórmulas de suma incluidas automáticamente." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const setQuickPeriod = (period: "week" | "month" | "quarter" | "year") => {
    const now = new Date();
    let start: Date;
    let end = now;
    switch (period) {
      case "week":
        start = new Date(now);
        start.setDate(now.getDate() - 7);
        break;
      case "month":
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case "quarter":
        start = new Date(now);
        start.setMonth(now.getMonth() - 3);
        break;
      case "year":
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
    }
    setStartDate(format(start, "yyyy-MM-dd"));
    setEndDate(format(end, "yyyy-MM-dd"));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ textAlign: "center", paddingTop: 8 }}>
        <div className="gp-empty-ic" style={{ margin: "0 auto 10px" }}>
          <FileSpreadsheet style={{ width: 24, height: 24 }} />
        </div>
        <h4 style={{ margin: 0 }}>Exportar caja</h4>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--gp-muted-c)" }}>
          Excel con fórmulas automáticas
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        <button className="gp-btn sm" onClick={() => setQuickPeriod("week")}>Semana</button>
        <button className="gp-btn sm" onClick={() => setQuickPeriod("month")}>Mes</button>
        <button className="gp-btn sm" onClick={() => setQuickPeriod("year")}>Año</button>
      </div>

      <div className="gp-card" style={{ padding: "14px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gp-muted-c)", display: "block", marginBottom: 6 }}>
              Desde
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--gp-muted-c)", display: "block", marginBottom: 6 }}>
              Hasta
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      <button
        className="gp-btn primary"
        style={{ width: "100%", justifyContent: "center", padding: "12px 20px", fontSize: 15 }}
        onClick={exportToCSV}
        disabled={loading || !startDate || !endDate}
      >
        {loading
          ? <Loader2 style={{ width: 16, height: 16, animation: "spin .7s linear infinite" }} />
          : <Download style={{ width: 16, height: 16 }} />}
        Descargar Excel
      </button>
    </div>
  );
};
