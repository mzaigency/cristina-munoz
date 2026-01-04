import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import {
  FileText,
  Download,
  Loader2,
  Calendar,
  Euro,
  Users,
  TrendingUp
} from "lucide-react";

interface PDFReportsGeneratorProps {
  tenantId: string;
  tenantName?: string;
}

export function PDFReportsGenerator({ tenantId, tenantName = "Salón" }: PDFReportsGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const { toast } = useToast();

  const generatePDF = async (reportType: "monthly" | "productivity" | "services") => {
    setGenerating(true);
    
    try {
      const [year, month] = selectedMonth.split("-").map(Number);
      const startDate = format(startOfMonth(new Date(year, month - 1)), "yyyy-MM-dd");
      const endDate = format(endOfMonth(new Date(year, month - 1)), "yyyy-MM-dd");
      const monthName = format(new Date(year, month - 1), "MMMM yyyy", { locale: es });

      // Fetch data based on report type
      let reportData: any = { 
        tenantName, 
        month: monthName,
        generatedAt: format(new Date(), "dd/MM/yyyy HH:mm")
      };

      if (reportType === "monthly" || reportType === "productivity") {
        const { data: transactions } = await supabase
          .from("transactions")
          .select("*")
          .eq("tenant_id", tenantId)
          .eq("voided", false)
          .gte("created_at", `${startDate}T00:00:00`)
          .lte("created_at", `${endDate}T23:59:59`);

        const totalSales = (transactions || []).reduce((sum, t) => sum + Number(t.total), 0);
        const cashSales = (transactions || []).filter(t => t.payment_method === "cash")
          .reduce((sum, t) => sum + Number(t.total), 0);
        const cardSales = (transactions || []).filter(t => t.payment_method === "card")
          .reduce((sum, t) => sum + Number(t.total), 0);
        const totalTips = (transactions || []).reduce((sum, t) => sum + (Number(t.tip_amount) || 0), 0);
        const avgTransaction = transactions && transactions.length > 0 ? totalSales / transactions.length : 0;

        // Sales by stylist
        const salesByStylist: Record<string, { sales: number; count: number }> = {};
        (transactions || []).forEach(t => {
          const stylist = t.stylist || "Sin asignar";
          if (!salesByStylist[stylist]) salesByStylist[stylist] = { sales: 0, count: 0 };
          salesByStylist[stylist].sales += Number(t.total);
          salesByStylist[stylist].count += 1;
        });

        // Previous month comparison
        const prevMonthStart = format(startOfMonth(subMonths(new Date(year, month - 1), 1)), "yyyy-MM-dd");
        const prevMonthEnd = format(endOfMonth(subMonths(new Date(year, month - 1), 1)), "yyyy-MM-dd");
        
        const { data: prevTransactions } = await supabase
          .from("transactions")
          .select("total")
          .eq("tenant_id", tenantId)
          .eq("voided", false)
          .gte("created_at", `${prevMonthStart}T00:00:00`)
          .lte("created_at", `${prevMonthEnd}T23:59:59`);

        const prevTotalSales = (prevTransactions || []).reduce((sum, t) => sum + Number(t.total), 0);
        const growthPercent = prevTotalSales > 0 ? ((totalSales - prevTotalSales) / prevTotalSales) * 100 : 0;

        reportData = {
          ...reportData,
          totalSales,
          cashSales,
          cardSales,
          totalTips,
          avgTransaction,
          transactionCount: transactions?.length || 0,
          salesByStylist: Object.entries(salesByStylist).map(([name, data]) => ({ name, ...data })),
          prevTotalSales,
          growthPercent
        };
      }

      if (reportType === "services" || reportType === "monthly") {
        const { data: transactions } = await supabase
          .from("transactions")
          .select("services")
          .eq("tenant_id", tenantId)
          .eq("voided", false)
          .gte("created_at", `${startDate}T00:00:00`)
          .lte("created_at", `${endDate}T23:59:59`);

        const serviceCount: Record<string, { count: number; revenue: number }> = {};
        (transactions || []).forEach(t => {
          const services = Array.isArray(t.services) ? t.services : [];
          services.forEach((s: any) => {
            const name = s.name || "Sin nombre";
            if (!serviceCount[name]) serviceCount[name] = { count: 0, revenue: 0 };
            serviceCount[name].count += 1;
            serviceCount[name].revenue += Number(s.price) || 0;
          });
        });

        reportData.topServices = Object.entries(serviceCount)
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
      }

      // Generate HTML for PDF
      const html = generateReportHTML(reportType, reportData);
      
      // Open print dialog
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
        };
      }

      toast({ title: "Informe generado", description: "El informe está listo para imprimir o guardar como PDF" });
    } catch (error: any) {
      console.error("Error generating report:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const generateReportHTML = (type: string, data: any) => {
    const styles = `
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
        h1 { color: #8B5CF6; margin-bottom: 5px; }
        h2 { color: #666; border-bottom: 2px solid #8B5CF6; padding-bottom: 10px; margin-top: 30px; }
        .header { text-align: center; margin-bottom: 40px; }
        .meta { color: #666; font-size: 14px; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
        .stat-card { background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 28px; font-weight: bold; color: #8B5CF6; }
        .stat-label { color: #666; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #8B5CF6; color: white; }
        tr:hover { background: #f5f5f5; }
        .growth-positive { color: #10B981; }
        .growth-negative { color: #EF4444; }
        @media print { body { padding: 20px; } }
      </style>
    `;

    let content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Informe - ${data.tenantName}</title>
        ${styles}
      </head>
      <body>
        <div class="header">
          <h1>${data.tenantName}</h1>
          <p class="meta">${type === "monthly" ? "Resumen Mensual" : type === "productivity" ? "Informe de Productividad" : "Servicios Más Populares"}</p>
          <p class="meta">${data.month}</p>
          <p class="meta">Generado: ${data.generatedAt}</p>
        </div>
    `;

    if (type === "monthly" || type === "productivity") {
      content += `
        <h2>Resumen de Ventas</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${data.totalSales?.toFixed(2) || 0}€</div>
            <div class="stat-label">Total Ventas</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.transactionCount || 0}</div>
            <div class="stat-label">Transacciones</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.avgTransaction?.toFixed(2) || 0}€</div>
            <div class="stat-label">Ticket Medio</div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${data.cashSales?.toFixed(2) || 0}€</div>
            <div class="stat-label">Efectivo</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.cardSales?.toFixed(2) || 0}€</div>
            <div class="stat-label">Tarjeta</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.totalTips?.toFixed(2) || 0}€</div>
            <div class="stat-label">Propinas</div>
          </div>
        </div>

        <p style="text-align: center;" class="${data.growthPercent >= 0 ? 'growth-positive' : 'growth-negative'}">
          ${data.growthPercent >= 0 ? '↑' : '↓'} ${Math.abs(data.growthPercent).toFixed(1)}% vs mes anterior 
          (${data.prevTotalSales?.toFixed(2) || 0}€)
        </p>

        <h2>Productividad por Estilista</h2>
        <table>
          <thead>
            <tr>
              <th>Estilista</th>
              <th>Servicios</th>
              <th>Ventas</th>
              <th>Media</th>
            </tr>
          </thead>
          <tbody>
            ${(data.salesByStylist || []).map((s: any) => `
              <tr>
                <td>${s.name}</td>
                <td>${s.count}</td>
                <td>${s.sales.toFixed(2)}€</td>
                <td>${(s.sales / s.count).toFixed(2)}€</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    if (type === "services" || type === "monthly") {
      content += `
        <h2>Servicios Más Populares</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Servicio</th>
              <th>Cantidad</th>
              <th>Ingresos</th>
            </tr>
          </thead>
          <tbody>
            ${(data.topServices || []).map((s: any, i: number) => `
              <tr>
                <td>${i + 1}</td>
                <td>${s.name}</td>
                <td>${s.count}</td>
                <td>${s.revenue.toFixed(2)}€</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    content += `
      </body>
      </html>
    `;

    return content;
  };

  // Generate month options (last 12 months)
  const monthOptions = [];
  for (let i = 0; i < 12; i++) {
    const date = subMonths(new Date(), i);
    monthOptions.push({
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM yyyy", { locale: es })
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Informes PDF
        </CardTitle>
        <CardDescription>Genera informes descargables de tu negocio</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Período</label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Button 
            variant="outline" 
            className="h-auto py-4 flex-col gap-2"
            onClick={() => generatePDF("monthly")}
            disabled={generating}
          >
            {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Euro className="h-5 w-5" />}
            <span className="text-xs">Resumen Mensual</span>
          </Button>

          <Button 
            variant="outline" 
            className="h-auto py-4 flex-col gap-2"
            onClick={() => generatePDF("productivity")}
            disabled={generating}
          >
            {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Users className="h-5 w-5" />}
            <span className="text-xs">Productividad</span>
          </Button>

          <Button 
            variant="outline" 
            className="h-auto py-4 flex-col gap-2"
            onClick={() => generatePDF("services")}
            disabled={generating}
          >
            {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <TrendingUp className="h-5 w-5" />}
            <span className="text-xs">Top Servicios</span>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Los informes se abren en una nueva ventana para imprimir o guardar como PDF
        </p>
      </CardContent>
    </Card>
  );
}