import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  FileText, 
  Printer, 
  Calendar,
  User,
  Building2,
  Loader2,
  Receipt
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  fiscal_name: string | null;
  nif: string | null;
  fiscal_address: string | null;
  items: any[];
  subtotal: number;
  discount: number;
  tip_amount: number;
  total: number;
  payment_method: string;
  stylist_name: string | null;
  created_at: string;
}

interface InvoiceHistoryProps {
  tenantId: string;
}

export const InvoiceHistory = ({ tenantId }: InvoiceHistoryProps) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tenantData, setTenantData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchInvoices();
    fetchTenantData();
  }, [tenantId]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvoices((data || []).map(inv => ({
        ...inv,
        items: Array.isArray(inv.items) ? inv.items : []
      })));
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast({ title: "Error al cargar facturas", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchTenantData = async () => {
    const { data } = await supabase
      .from("tenants")
      .select("name, logo_url, address, city, postal_code, phone, email")
      .eq("id", tenantId)
      .maybeSingle();
    
    if (data) setTenantData(data);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR"
    }).format(amount);
  };

  const reprintInvoice = (invoice: Invoice) => {
    if (!tenantData) {
      toast({ title: "Error: datos del negocio no disponibles", variant: "destructive" });
      return;
    }

    const itemsHtml = invoice.items.map((item: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: right;">${formatCurrency(item.price)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: right;">${formatCurrency(item.total)}</td>
      </tr>
    `).join("");

    const invoiceDate = format(new Date(invoice.created_at), "d 'de' MMMM 'de' yyyy", { locale: es });

    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Factura ${invoice.invoice_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #333; }
          .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #333; }
          .business-info { flex: 1; }
          .business-name { font-size: 28px; font-weight: bold; margin-bottom: 8px; }
          .business-details { color: #666; font-size: 14px; line-height: 1.6; }
          .invoice-badge { background: #333; color: white; padding: 20px 30px; text-align: center; }
          .invoice-badge h2 { font-size: 24px; margin-bottom: 4px; }
          .invoice-badge p { font-size: 14px; opacity: 0.9; }
          .parties { display: flex; gap: 40px; margin-bottom: 30px; }
          .party { flex: 1; padding: 20px; background: #f8f8f8; border-radius: 8px; }
          .party-title { font-size: 12px; text-transform: uppercase; color: #888; margin-bottom: 8px; font-weight: 600; }
          .party-name { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
          .party-details { font-size: 14px; color: #666; line-height: 1.5; }
          table { width: 100%; border-collapse: collapse; margin: 30px 0; }
          thead { background: #333; color: white; }
          th { padding: 14px 12px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; }
          th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: right; }
          th:nth-child(2) { text-align: center; }
          tbody tr:hover { background: #fafafa; }
          .totals { margin-top: 20px; display: flex; justify-content: flex-end; }
          .totals-box { width: 280px; }
          .totals-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .totals-row.discount { color: #f97316; }
          .totals-row.tip { color: #ec4899; }
          .totals-row.final { border-top: 3px solid #333; border-bottom: none; padding-top: 16px; margin-top: 8px; font-size: 20px; font-weight: bold; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; display: flex; justify-content: space-between; color: #888; font-size: 12px; }
          @media print { 
            body { padding: 20px; } 
            .invoice-badge { background: #333 !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            thead { background: #333 !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <div class="business-info">
            ${tenantData.logo_url ? `<img src="${tenantData.logo_url}" alt="${tenantData.name}" style="height: 60px; margin-bottom: 12px; border-radius: 8px;">` : ""}
            <div class="business-name">${tenantData.name}</div>
            <div class="business-details">
              ${tenantData.address || ""}${tenantData.city ? `, ${tenantData.city}` : ""}${tenantData.postal_code ? ` ${tenantData.postal_code}` : ""}<br>
              ${tenantData.phone ? `Tel: ${tenantData.phone}` : ""}${tenantData.email ? ` · ${tenantData.email}` : ""}
            </div>
          </div>
          <div class="invoice-badge">
            <h2>FACTURA</h2>
            <p>${invoice.invoice_number}</p>
          </div>
        </div>
        
        <div class="parties">
          <div class="party">
            <div class="party-title">Datos del emisor</div>
            <div class="party-name">${tenantData.name}</div>
            <div class="party-details">
              ${tenantData.address || ""}${tenantData.city ? `<br>${tenantData.city}` : ""}${tenantData.postal_code ? ` ${tenantData.postal_code}` : ""}<br>
              ${tenantData.phone ? `Tel: ${tenantData.phone}` : ""}
            </div>
          </div>
          <div class="party">
            <div class="party-title">Datos del cliente</div>
            <div class="party-name">${invoice.fiscal_name || invoice.customer_name}</div>
            <div class="party-details">
              ${invoice.nif ? `NIF: ${invoice.nif}<br>` : ""}
              ${invoice.fiscal_address || ""}
            </div>
          </div>
        </div>

        <p style="margin-bottom: 10px; color: #666; font-size: 14px;">Fecha: ${invoiceDate}</p>
        
        <table>
          <thead>
            <tr>
              <th>Concepto</th>
              <th>Cant.</th>
              <th>Precio</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="totals-box">
            <div class="totals-row">
              <span>Subtotal</span>
              <span>${formatCurrency(invoice.subtotal)}</span>
            </div>
            ${invoice.discount > 0 ? `
              <div class="totals-row discount">
                <span>Descuento</span>
                <span>-${formatCurrency(invoice.discount)}</span>
              </div>
            ` : ""}
            ${invoice.tip_amount > 0 ? `
              <div class="totals-row tip">
                <span>Propina</span>
                <span>+${formatCurrency(invoice.tip_amount)}</span>
              </div>
            ` : ""}
            <div class="totals-row final">
              <span>TOTAL</span>
              <span>${formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <div>Atendido por: ${invoice.stylist_name || "N/A"}</div>
          <div>Pago: ${invoice.payment_method === "cash" ? "Efectivo" : invoice.payment_method === "card" ? "Tarjeta" : "Mixto"}</div>
        </div>
      </body>
      </html>
    `;

    const invoiceWindow = window.open("", "_blank");
    if (invoiceWindow) {
      invoiceWindow.document.write(invoiceHtml);
      invoiceWindow.document.close();
      invoiceWindow.print();
    }
    
    toast({ title: "Factura abierta para impresión 📄" });
  };

  const filteredInvoices = invoices.filter(invoice => {
    const query = searchQuery.toLowerCase();
    return (
      invoice.invoice_number.toLowerCase().includes(query) ||
      invoice.customer_name.toLowerCase().includes(query) ||
      (invoice.fiscal_name?.toLowerCase().includes(query) ?? false) ||
      (invoice.nif?.toLowerCase().includes(query) ?? false)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por número, cliente o NIF..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{invoices.length}</p>
            <p className="text-xs text-muted-foreground">Total facturas</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10">
            <Receipt className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">
              {formatCurrency(invoices.reduce((sum, inv) => sum + Number(inv.total), 0))}
            </p>
            <p className="text-xs text-muted-foreground">Total facturado</p>
          </div>
        </Card>
      </div>

      {/* Invoice List */}
      <div className="space-y-2">
        <AnimatePresence>
          {filteredInvoices.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-muted-foreground"
            >
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No hay facturas {searchQuery ? "que coincidan" : "emitidas"}</p>
            </motion.div>
          ) : (
            filteredInvoices.map((invoice, index) => (
              <motion.div
                key={invoice.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="font-mono text-xs">
                          {invoice.invoice_number}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(invoice.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2">
                        {invoice.fiscal_name ? (
                          <div className="flex items-center gap-1.5 text-sm">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-medium truncate">{invoice.fiscal_name}</span>
                            {invoice.nif && (
                              <span className="text-muted-foreground">({invoice.nif})</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-sm">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="truncate">{invoice.customer_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-primary">
                        {formatCurrency(invoice.total)}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => reprintInvoice(invoice)}
                        className="mt-2 gap-1.5"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        Reimprimir
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
