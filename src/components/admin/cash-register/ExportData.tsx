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
      // CAMBIO 1: Filtramos directamente en la base de datos las NO anuladas (voided=false)
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("voided", false) // <--- Filtro añadido
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (!transactions || transactions.length === 0) {
        toast({ title: "No hay datos en el período seleccionado", variant: "destructive" });
        setLoading(false);
        return;
      }

      // CAMBIO 2: Nuevas cabeceras específicas
      const headers = ["Fecha y Hora", "Importe Tarjeta", "Importe Efectivo", "Descuento", "Propinas"];

      // Helper para formatear moneda español (coma decimal)
      const fmtMoney = (amount: any) => (amount || 0).toFixed(2).replace(".", ",");

      // Variables para acumular totales mientras recorremos
      let sumCard = 0;
      let sumCash = 0;
      let sumDiscount = 0;
      let sumTips = 0;
      let sumTotalGeneral = 0;

      const rows = transactions.map((tx) => {
        const date = new Date(tx.created_at);

        // Lógica para separar importes según método de pago
        // Nota: Si hay método 'mixto' y no hay desglose en la BD, aquí asignamos según 'total'.
        // Ajusta esta lógica si tienes campos específicos para pago mixto.
        let cardAmount = 0;
        let cashAmount = 0;
        const total = Number(tx.total || 0);

        if (tx.payment_method === "card") {
          cardAmount = total;
        } else if (tx.payment_method === "cash") {
          cashAmount = total;
        } else if (tx.payment_method === "mixed") {
          // Si es mixto y no tenemos desglose, podrías dividirlo o asignarlo a uno.
          // Por defecto aquí lo pondré en Efectivo o lo puedes dejar en 0.
          // cashAmount = total;
        }

        // Acumular totales
        sumCard += cardAmount;
        sumCash += cashAmount;
        sumDiscount += Number(tx.discount || 0);
        sumTips += Number(tx.tip_amount || 0);
        sumTotalGeneral += total;

        return [
          format(date, "dd/MM/yyyy HH:mm"), // Fecha y Hora juntas
          fmtMoney(cardAmount),
          fmtMoney(cashAmount),
          fmtMoney(tx.discount),
          fmtMoney(tx.tip_amount),
        ];
      });

      // Filas de resumen alineadas con las columnas
      rows.push([]); // Fila vacía separadora

      // Fila de Totales por columna
      rows.push([
        "TOTALES", // Columna Fecha
        fmtMoney(sumCard), // Columna Tarjeta
        fmtMoney(sumCash), // Columna Efectivo
        fmtMoney(sumDiscount), // Columna Descuento
        fmtMoney(sumTips), // Columna Propinas
      ]);

      // Fila de Total General
      rows.push([]);
      rows.push([
        "TOTAL GENERAL (Suma Tarjeta + Efectivo)",
        "",
        fmtMoney(sumTotalGeneral), // Lo ponemos aquí o donde prefieras visualizarlo
        "",
        "",
      ]);

      // CSV Construction (España: ; delimitador)
      const escapeCSV = (val: string) => {
        if (val.includes(";") || val.includes('"') || val.includes("\n")) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      };

      const csvContent = [
        headers.join(";"),
        ...rows.map((row) => row.map((cell) => escapeCSV(String(cell))).join(";")),
      ].join("\n");

      // Add BOM for Excel UTF-8 compatibility
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `caja_filtrada_${startDate}_${endDate}.csv`;
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
        <h3 className="text-lg font-semibold">Exportar Resumen Financiero</h3>
        <p className="text-sm text-muted-foreground">
          Descarga un CSV con desglose de Tarjeta, Efectivo y Totales (sin anulaciones)
        </p>
      </div>

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
      </Card>

      <Button
        onClick={exportToCSV}
        disabled={loading || !startDate || !endDate}
        className="w-full h-12 gap-2"
        size="lg"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
        {loading ? "Exportando..." : "Descargar Excel"}
      </Button>
    </div>
  );
};
