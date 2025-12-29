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

      // Build CSV content with user's requested format
      const headers = [
        "Fecha y Hora",
        "Importe Tarjeta",
        "Importe Efectivo",
        "Descuento",
        "Propinas"
      ];

      // Calculate amounts per transaction based on payment method
      const rows = transactions.filter(tx => !tx.voided).map(tx => {
        const date = new Date(tx.created_at);
        const total = Number(tx.total) || 0;
        const discount = Number(tx.discount) || 0;
        const tips = Number(tx.tip_amount) || 0;
        
        let cardAmount = 0;
        let cashAmount = 0;
        
        if (tx.payment_method === "card") {
          cardAmount = total;
        } else if (tx.payment_method === "cash") {
          cashAmount = total;
        } else if (tx.payment_method === "mixed" && tx.payment_details) {
          // For mixed payments, get the split from payment_details
          const details = tx.payment_details as { card?: number; cash?: number };
          cardAmount = Number(details.card) || 0;
          cashAmount = Number(details.cash) || 0;
        }
        
        return [
          format(date, "dd/MM/yyyy HH:mm"),
          cardAmount > 0 ? cardAmount.toFixed(2) : "",
          cashAmount > 0 ? cashAmount.toFixed(2) : "",
          discount > 0 ? discount.toFixed(2) : "",
          tips > 0 ? tips.toFixed(2) : ""
        ];
      });

      // Calculate totals from valid transactions
      const validTxs = transactions.filter(tx => !tx.voided);
      let totalCard = 0;
      let totalCash = 0;
      
      validTxs.forEach(tx => {
        const total = Number(tx.total) || 0;
        if (tx.payment_method === "card") {
          totalCard += total;
        } else if (tx.payment_method === "cash") {
          totalCash += total;
        } else if (tx.payment_method === "mixed" && tx.payment_details) {
          const details = tx.payment_details as { card?: number; cash?: number };
          totalCard += Number(details.card) || 0;
          totalCash += Number(details.cash) || 0;
        }
      });
      
      const totalDiscounts = validTxs.reduce((sum, tx) => sum + Number(tx.discount || 0), 0);
      const totalTips = validTxs.reduce((sum, tx) => sum + Number(tx.tip_amount || 0), 0);
      const grandTotal = totalCard + totalCash;

      // Add empty rows and summary at the bottom
      rows.push([]);
      rows.push([]);
      rows.push(["Total Tarjeta", totalCard.toFixed(2)]);
      rows.push(["Total Efectivo", totalCash.toFixed(2)]);
      rows.push(["Total Descuento", totalDiscounts.toFixed(2)]);
      rows.push(["Total Propinas", totalTips.toFixed(2)]);
      rows.push([]);
      rows.push(["TOTAL", grandTotal.toFixed(2)]);

      // Convert to CSV string
      const escapeCSV = (val: string) => {
        if (val.includes(",") || val.includes('"') || val.includes("\n")) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      };

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => escapeCSV(String(cell))).join(","))
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
        description: `${transactions.length} transacciones exportadas`
      });
    } catch (error: any) {
      console.error("Error exporting:", error);
      toast({ 
        title: "Error al exportar", 
        description: error.message,
        variant: "destructive" 
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
          Descarga un archivo CSV con todas las transacciones del período seleccionado
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
            <Label htmlFor="start-date" className="text-sm">Desde</Label>
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
            <Label htmlFor="end-date" className="text-sm">Hasta</Label>
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
            Período: {format(new Date(startDate), "d 'de' MMMM yyyy", { locale: es })} - {format(new Date(endDate), "d 'de' MMMM yyyy", { locale: es })}
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
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Download className="h-5 w-5" />
        )}
        {loading ? "Exportando..." : "Descargar CSV"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        El archivo CSV se puede abrir con Excel, Google Sheets u otras aplicaciones de hojas de cálculo
      </p>
    </div>
  );
};
