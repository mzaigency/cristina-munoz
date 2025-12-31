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

      // 1. Definir Cabeceras
      // A: Fecha, B: Tarjeta, C: Efectivo, D: Descuento, E: Propinas
      const headers = ["Fecha y Hora", "Importe Tarjeta", "Importe Efectivo", "Descuento", "Propinas"];

      const fmtMoney = (amount: any) => (amount || 0).toFixed(2).replace(".", ",");

      // 2. Construir filas de datos
      const rows = transactions.map((tx) => {
        const date = new Date(tx.created_at);
        let cardAmount = 0;
        let cashAmount = 0;
        const total = Number(tx.total || 0);

        if (tx.payment_method === "card") {
          cardAmount = total;
        } else if (tx.payment_method === "cash") {
          cashAmount = total;
        }
        // Si hay mixto, ajusta aquí tu lógica

        return [
          format(date, "dd/MM/yyyy HH:mm"),
          fmtMoney(cardAmount),
          fmtMoney(cashAmount),
          fmtMoney(tx.discount),
          fmtMoney(tx.tip_amount),
        ];
      });

      // --- LÓGICA DE FÓRMULAS EXCEL ---

      // La fila 1 es Cabeceras.
      // Los datos empiezan en la fila 2.
      const dataStartRow = 2;
      // Los datos terminan en: startRow + cantidad - 1.
      const dataEndRow = dataStartRow + transactions.length - 1;

      // Dejamos una fila vacía después de los datos
      rows.push([]);

      // La fila de TOTALES será la siguiente (transactions.length + 3)
      const totalRowIndex = dataEndRow + 2;

      // Fila de Sumas por Columna
      // Usamos =SUMA(...) porque el Excel estará en español.
      rows.push([
        "TOTALES",
        `=SUMA(B${dataStartRow}:B${dataEndRow})`, // Suma Tarjeta
        `=SUMA(C${dataStartRow}:C${dataEndRow})`, // Suma Efectivo
        `=SUMA(D${dataStartRow}:D${dataEndRow})`, // Suma Descuento
        `=SUMA(E${dataStartRow}:E${dataEndRow})`, // Suma Propinas
      ]);

      // Fila vacía
      rows.push([]);

      // Fila de Total General Calculado
      // Fórmula: (Total Tarjeta + Total Efectivo + Total Propinas) - Total Descuento
      // Las celdas de totales están en la fila `totalRowIndex`
      // Tarjeta es B, Efectivo es C, Descuento es D, Propinas es E
      const formulaTotalGeneral = `=B${totalRowIndex}+C${totalRowIndex}+E${totalRowIndex}-D${totalRowIndex}`;

      rows.push(["TOTAL GENERAL", "", formulaTotalGeneral, "", ""]);

      // --- GENERACIÓN CSV ---
      const escapeCSV = (val: string) => {
        // Si empieza con =, es fórmula, no le ponemos comillas o Excel lo trata como texto literal
        if (typeof val === "string" && val.startsWith("=")) {
          return val;
        }
        if (val.includes(";") || val.includes('"') || val.includes("\n")) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      };

      const csvContent = [
        headers.join(";"),
        ...rows.map((row) => row.map((cell) => escapeCSV(String(cell))).join(";")),
      ].join("\n");

      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Contabilidad_${startDate}_${endDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Excel Generado",
        description: "Se han incluido las fórmulas de suma automáticamente.",
      });
    } catch (error: any) {
      console.error("Error exporting:", error);
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
    <div className="space-y-6">
      <div className="text-center py-4">
        <FileSpreadsheet className="h-12 w-12 mx-auto text-primary mb-3" />
        <h3 className="text-lg font-semibold">Exportar Caja Inteligente</h3>
        <p className="text-sm text-muted-foreground">
          Genera un Excel con fórmulas automáticas (SUMA) listas para usar.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        <Button variant="outline" size="sm" onClick={() => setQuickPeriod("week")}>
          Semana
        </Button>
        <Button variant="outline" size="sm" onClick={() => setQuickPeriod("month")}>
          Mes
        </Button>
        <Button variant="outline" size="sm" onClick={() => setQuickPeriod("year")}>
          Año
        </Button>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Desde</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label>Hasta</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
      </Card>

      <Button
        onClick={exportToCSV}
        disabled={loading || !startDate || !endDate}
        className="w-full h-12 gap-2"
        size="lg"
      >
        {loading ? <Loader2 className="animate-spin" /> : <Download />}
        Descargar Excel con Fórmulas
      </Button>
    </div>
  );
};
