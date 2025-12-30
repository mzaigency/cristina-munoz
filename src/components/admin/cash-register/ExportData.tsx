import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Download, Loader2, Calendar, FileSpreadsheet } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";

interface ExportDataProps {
  tenantId: string;
}

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
      // Fetch transactions in the selected period
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("tenant_id", tenantId)
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (!transactions || transactions.length === 0) {
        toast({ title: "No hay datos en el período seleccionado", variant: "destructive" });
        setLoading(false);
        return;
      }

      // Build CSV content
      const headers = [
        "Fecha",
        "Hora",
        "Cliente",
        "Estilista",
        "Servicios",
        "Subtotal",
        "Descuento",
        "Propina",
        "Total",
        "Método de Pago",
        "Anulado",
        "Notas",
      ];

      // Helper para formatear moneda español (coma decimal)
      const fmtMoney = (amount: any) => (amount || 0).toFixed(2).replace(".", ",");

      const rows = transactions.map((tx) => {
        const date = new Date(tx.created_at);
        const services = Array.isArray(tx.services) ? tx.services.map((s: any) => s.name).join(" | ") : ""; // Usamos | para separar servicios internamente

        return [
          format(date, "dd/MM/yyyy"),
          format(date, "HH:mm"),
          tx.customer_name || "",
          tx.stylist || "",
          services,
          fmtMoney(tx.subtotal), // Formato con coma 10,00
          fmtMoney(tx.discount),
          fmtMoney(tx.tip_amount),
          fmtMoney(tx.total),
          tx.payment_method === "cash" ? "Efectivo" : tx.payment_method === "card" ? "Tarjeta" : "Mixto",
          tx.voided ? "Sí" : "No",
          tx.notes || "",
        ];
      });

      // Calculate totals
      const validTxs = transactions.filter((tx) => !tx.voided);
      const totalCash = validTxs
        .filter((tx) => tx.payment_method === "cash")
        .reduce((sum, tx) => sum + Number(tx.total), 0);
      const totalCard = validTxs
        .filter((tx) => tx.payment_method === "card")
        .reduce((sum, tx) => sum + Number(tx.total), 0);
      const totalMixed = validTxs
        .filter((tx) => tx.payment_method === "mixed")
        .reduce((sum, tx) => sum + Number(tx.total), 0);
      const totalAll = validTxs.reduce((sum, tx) => sum + Number(tx.total), 0);
      const totalTips = validTxs.reduce((sum, tx) => sum + Number(tx.tip_amount || 0), 0);
      const totalDiscounts = validTxs.reduce((sum, tx) => sum + Number(tx.discount || 0), 0);

      // Add summary rows
      rows.push([]);
      rows.push(["RESUMEN DEL PERÍODO"]);
      rows.push(["Total transacciones", transactions.length.toString()]);
      rows.push(["Transacciones válidas", validTxs.length.toString()]);
      rows.push(["Total en Efectivo", "", "", "", "", "", "", "", fmtMoney(totalCash)]);
      rows.push(["Total en Tarjeta", "", "", "", "", "", "", "", fmtMoney(totalCard)]);
      rows.push(["Total Mixto", "", "", "", "", "", "", "", fmtMoney(totalMixed)]);
      rows.push(["Total Propinas", "", "", "", "", "", "", fmtMoney(totalTips)]);
      rows.push(["Total Descuentos", "", "", "", "", "", fmtMoney(totalDiscounts)]);
      rows.push(["TOTAL GENERAL", "", "", "", "", "", "", "", fmtMoney(totalAll)]);

      // Convert to CSV string logic updated for Spain (semicolon)
      const escapeCSV = (val: string) => {
        // Ahora buscamos punto y coma (;) en lugar de coma
        if (val.includes(";") || val.includes('"') || val.includes("\n")) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      };

      const csvContent = [
        headers.join(";"), // CAMBIO: Usar ; como delimitador
        ...rows.map((row) => row.map((cell) => escapeCSV(String(cell))).join(";")), // CAMBIO: Usar ;
      ].join("\n");

      // Add BOM for Excel UTF-8 compatibility
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

      // Download file
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `caja_${startDate}_${endDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Exportación completada",
        description: `${transactions.length} transacciones exportadas`,
      });
    } catch (error: any) {
      console.error("Error exporting:", error);
      toast({
        title: "Error al exportar",
        description: error.message,
        variant: "destructive",
      });
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
    <div className="space-y-6">
      <div className="text-center py-4">
        <FileSpreadsheet className="h-12 w-12 mx-auto text-primary mb-3" />
        <h3 className="text-lg font-semibold">Exportar Datos de Caja</h3>
        <p className="text-sm text-muted-foreground">
          Descarga un archivo CSV compatible con Excel (separado por punto y coma)
        </p>
      </div>

      {/* Quick period buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Button variant="outline" size="sm" onClick={() => setQuickPeriod("week")}>
          Última semana
        </Button>
        <Button variant="outline" size="sm" onClick={() => setQuickPeriod("month")}>
          Este mes
        </Button>
        <Button variant="outline" size="sm" onClick={() => setQuickPeriod("quarter")}>
          Último trimestre
        </Button>
        <Button variant="outline" size="sm" onClick={() => setQuickPeriod("year")}>
          Este año
        </Button>
      </div>

      {/* Date range inputs */}
      <Card className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start-date" className="text-sm">
              Desde
            </Label>
            <div className="relative mt-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="end-date" className="text-sm">
              Hasta
            </Label>
            <div className="relative mt-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {startDate && endDate && (
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Período: {format(new Date(startDate), "d 'de' MMMM yyyy", { locale: es })} -{" "}
            {format(new Date(endDate), "d 'de' MMMM yyyy", { locale: es })}
          </p>
        )}
      </Card>

      {/* Export button */}
      <Button
        onClick={exportToCSV}
        disabled={loading || !startDate || !endDate}
        className="w-full h-12 gap-2"
        size="lg"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
        {loading ? "Exportando..." : "Descargar Excel (Formato España)"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        El archivo CSV está formateado para Excel en español (separador ; y decimales con coma)
      </p>
    </div>
  );
};
