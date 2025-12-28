import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, 
  Banknote, 
  CreditCard, 
  CheckCircle2,
  Percent,
  Heart,
  Scissors,
  User,
  X,
  Plus,
  Minus,
  Package,
  PenLine,
  Mail,
  Receipt,
  Sparkles,
  FileText,
  Download
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface Service {
  id: string;
  name: string;
  price: number | null;
  category: string | null;
}

interface Stylist {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

interface SelectedItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: "service" | "product" | "manual";
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string | null;
  stock: number;
}

interface QuickPaymentProps {
  onTransactionCreated: () => void;
  tenantId: string;
}

type PaymentMethod = "cash" | "card" | "mixed";
type DiscountType = "percentage" | "fixed" | null;

export const QuickPayment = ({ onTransactionCreated, tenantId }: QuickPaymentProps) => {
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [selectedStylistId, setSelectedStylistId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  
  const [manualItemName, setManualItemName] = useState("");
  const [manualItemPrice, setManualItemPrice] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashAmount, setCashAmount] = useState("");
  const [cardAmount, setCardAmount] = useState("");
  const [cashGiven, setCashGiven] = useState("");
  
  const [discountType, setDiscountType] = useState<DiscountType>(null);
  const [discountValue, setDiscountValue] = useState("");
  const [discountReason, setDiscountReason] = useState("");
  const [showDiscount, setShowDiscount] = useState(false);
  
  const [tipAmount, setTipAmount] = useState("");
  const [showTip, setShowTip] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);
  
  const [activeCategory, setActiveCategory] = useState<string>("all");
  
  // Invoice data
  const [wantsInvoice, setWantsInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState({
    fiscalName: "",
    nif: "",
    fiscalAddress: ""
  });
  const [tenantData, setTenantData] = useState<any>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [tenantId]);

  const fetchData = async () => {
    try {
      const [servicesRes, stylistsRes, productsRes, tenantRes] = await Promise.all([
        supabase.from("services").select("id, name, price, category")
          .eq("tenant_id", tenantId).order("category").order("name"),
        supabase.from("tenant_stylists").select("id, name, slug, color")
          .eq("tenant_id", tenantId).eq("is_active", true).order("name"),
        supabase.from("products").select("id, name, price, category, stock")
          .eq("tenant_id", tenantId).eq("is_active", true).order("name"),
        supabase.from("tenants").select("name, logo_url, address, city, postal_code, phone, email")
          .eq("id", tenantId).single()
      ]);
      if (servicesRes.data) setServices(servicesRes.data);
      if (stylistsRes.data) setStylists(stylistsRes.data);
      if (productsRes.data) setProducts(productsRes.data as Product[]);
      if (tenantRes.data) setTenantData(tenantRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const subtotal = selectedItems.reduce((sum, s) => sum + s.price * s.quantity, 0);
  
  const calculateDiscount = () => {
    if (!discountType || !discountValue) return 0;
    const value = parseFloat(discountValue) || 0;
    return discountType === "percentage" 
      ? Math.min((subtotal * value) / 100, subtotal)
      : Math.min(value, subtotal);
  };

  const discountAmount = calculateDiscount();
  const total = Math.max(subtotal - discountAmount, 0);
  const tip = parseFloat(tipAmount) || 0;
  const grandTotal = total + tip;

  const numericCashAmount = parseFloat(cashAmount) || 0;
  const numericCardAmount = parseFloat(cardAmount) || 0;
  const numericCashGiven = parseFloat(cashGiven) || 0;

  const getMixedRemaining = () => Math.max(grandTotal - numericCashAmount - numericCardAmount, 0);
  const getChange = () => {
    if (paymentMethod === "mixed") return Math.max(numericCashGiven - numericCashAmount, 0);
    return Math.max(numericCashGiven - grandTotal, 0);
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(value);

  const categories = ["all", ...new Set([
    ...services.map(s => s.category || "Otros"),
    ...products.map(p => `📦 ${p.category || "Productos"}`)
  ])];

  const filteredItems = activeCategory === "all" 
    ? [...services, ...products.map(p => ({ ...p, category: `📦 ${p.category || "Productos"}` }))]
    : activeCategory.startsWith("📦")
      ? products.filter(p => `📦 ${p.category || "Productos"}` === activeCategory)
      : services.filter(s => (s.category || "Otros") === activeCategory);

  const toggleItem = (item: Service | Product) => {
    const isProduct = "stock" in item;
    const existing = selectedItems.find(s => s.id === item.id);
    
    if (existing) {
      setSelectedItems(selectedItems.filter(s => s.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, { 
        id: item.id, 
        name: item.name, 
        price: item.price || 0, 
        quantity: 1, 
        type: isProduct ? "product" : "service"
      }]);
    }
  };

  const addManualItem = () => {
    if (!manualItemName.trim() || !manualItemPrice) return;
    const price = parseFloat(manualItemPrice) || 0;
    if (price <= 0) return;
    
    setSelectedItems([...selectedItems, { 
      id: `manual-${Date.now()}`, 
      name: manualItemName.trim(), 
      price, 
      quantity: 1, 
      type: "manual" 
    }]);
    setManualItemName("");
    setManualItemPrice("");
    setShowManualInput(false);
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setSelectedItems(selectedItems.map(s => 
      s.id === itemId ? { ...s, quantity: Math.max(1, s.quantity + delta) } : s
    ));
  };

  const removeItem = (itemId: string) => {
    setSelectedItems(selectedItems.filter(s => s.id !== itemId));
  };

  const clearAll = () => {
    setSelectedItems([]);
    setSelectedStylistId("");
    setCustomerName("");
    setCustomerEmail("");
    setPaymentMethod("cash");
    setCashAmount("");
    setCardAmount("");
    setCashGiven("");
    setDiscountType(null);
    setDiscountValue("");
    setDiscountReason("");
    setTipAmount("");
    setShowDiscount(false);
    setShowTip(false);
    setWantsInvoice(false);
    setInvoiceData({ fiscalName: "", nif: "", fiscalAddress: "" });
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      toast({ title: "Selecciona al menos un servicio", variant: "destructive" });
      return;
    }
    if (!selectedStylistId) {
      toast({ title: "Selecciona un estilista", variant: "destructive" });
      return;
    }
    if (paymentMethod === "mixed" && getMixedRemaining() > 0.01) {
      toast({ title: `Faltan ${formatCurrency(getMixedRemaining())}`, variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const selectedStylist = stylists.find(s => s.id === selectedStylistId);
      const servicesData = selectedItems.map(s => ({
        id: s.id, name: s.name, price: s.price, quantity: s.quantity, 
        total: s.price * s.quantity, type: s.type
      }));

      const paymentDetails: Record<string, unknown> = {};
      if (paymentMethod === "mixed") {
        paymentDetails.cash_amount = numericCashAmount;
        paymentDetails.card_amount = numericCardAmount;
      }
      if ((paymentMethod === "cash" || paymentMethod === "mixed") && numericCashGiven > 0) {
        paymentDetails.cash_given = numericCashGiven;
        paymentDetails.change = getChange();
      }

      const transactionData = {
        stylist: selectedStylist?.slug || "unknown",
        stylist_id: selectedStylistId,
        customer_name: customerName.trim() || "Cliente",
        services: servicesData,
        subtotal,
        discount: discountAmount,
        discount_type: discountType,
        discount_reason: discountReason.trim() || null,
        total,
        tip_amount: tip,
        payment_method: paymentMethod,
        payment_details: paymentDetails,
        created_by: user.id,
        tenant_id: tenantId,
      };

      const { error } = await supabase.from("transactions").insert(transactionData as never);
      if (error) throw error;

      setLastTransaction({
        ...transactionData,
        stylistName: selectedStylist?.name || "Estilista",
        items: servicesData,
        grandTotal,
        customerEmail,
        wantsInvoice,
        invoiceData
      });
      
      setShowSuccess(true);
      clearAll();
      onTransactionCreated();
      
    } catch (error: unknown) {
      console.error("Error:", error);
      toast({ title: "Error al registrar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getEmailToUse = () => customerEmail || lastTransaction?.customerEmail || "";

  const sendTicketEmail = async () => {
    const email = getEmailToUse();
    if (!lastTransaction || !email) {
      toast({ title: "Introduce un email", variant: "destructive" });
      return;
    }

    try {
      setSendingEmail(true);
      const { data, error } = await supabase.functions.invoke("send-ticket", {
        body: {
          type: "ticket",
          customerEmail: email,
          customerName: lastTransaction.customer_name,
          tenantId,
          items: lastTransaction.items,
          subtotal: lastTransaction.subtotal,
          discount: lastTransaction.discount,
          discountReason: lastTransaction.discount_reason,
          tip: lastTransaction.tip_amount,
          total: lastTransaction.grandTotal,
          paymentMethod: lastTransaction.payment_method,
          stylistName: lastTransaction.stylistName,
          date: new Date().toLocaleDateString("es-ES", { 
            day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" 
          })
        }
      });

      if (error) throw error;
      toast({ title: "Ticket enviado por email ✉️" });
      setShowSuccess(false);
    } catch (error) {
      console.error("Error sending email:", error);
      toast({ title: "Error al enviar email", variant: "destructive" });
    } finally {
      setSendingEmail(false);
    }
  };

  const downloadInvoicePdf = async () => {
    if (!lastTransaction || !tenantData) return;
    
    const invoiceNumber = `FAC-${Date.now().toString(36).toUpperCase()}`;
    const invoiceDate = new Date().toLocaleDateString("es-ES", { 
      day: "numeric", month: "long", year: "numeric" 
    });

    // Save invoice to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("invoices").insert({
          tenant_id: tenantId,
          invoice_number: invoiceNumber,
          customer_name: lastTransaction.customer_name,
          fiscal_name: lastTransaction.invoiceData?.fiscalName || null,
          nif: lastTransaction.invoiceData?.nif || null,
          fiscal_address: lastTransaction.invoiceData?.fiscalAddress || null,
          items: lastTransaction.items,
          subtotal: lastTransaction.subtotal,
          discount: lastTransaction.discount || 0,
          tip_amount: lastTransaction.tip_amount || 0,
          total: lastTransaction.grandTotal,
          payment_method: lastTransaction.payment_method,
          stylist_name: lastTransaction.stylistName,
          created_by: user.id
        });
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
    }

    const itemsHtml = lastTransaction.items.map((item: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: right;">${formatCurrency(item.price)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: right;">${formatCurrency(item.total)}</td>
      </tr>
    `).join("");

    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Factura ${invoiceNumber}</title>
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
            <p>${invoiceNumber}</p>
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
            <div class="party-name">${lastTransaction.invoiceData?.fiscalName || lastTransaction.customer_name}</div>
            <div class="party-details">
              ${lastTransaction.invoiceData?.nif ? `NIF: ${lastTransaction.invoiceData.nif}<br>` : ""}
              ${lastTransaction.invoiceData?.fiscalAddress || ""}
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
              <span>${formatCurrency(lastTransaction.subtotal)}</span>
            </div>
            ${lastTransaction.discount > 0 ? `
              <div class="totals-row discount">
                <span>Descuento</span>
                <span>-${formatCurrency(lastTransaction.discount)}</span>
              </div>
            ` : ""}
            ${lastTransaction.tip_amount > 0 ? `
              <div class="totals-row tip">
                <span>Propina</span>
                <span>+${formatCurrency(lastTransaction.tip_amount)}</span>
              </div>
            ` : ""}
            <div class="totals-row final">
              <span>TOTAL</span>
              <span>${formatCurrency(lastTransaction.grandTotal)}</span>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <div>Atendido por: ${lastTransaction.stylistName}</div>
          <div>Pago: ${lastTransaction.payment_method === "cash" ? "Efectivo" : lastTransaction.payment_method === "card" ? "Tarjeta" : "Mixto"}</div>
        </div>
      </body>
      </html>
    `;

    // Open in new window and trigger print
    const invoiceWindow = window.open("", "_blank");
    if (invoiceWindow) {
      invoiceWindow.document.write(invoiceHtml);
      invoiceWindow.document.close();
      invoiceWindow.print();
    }
    
    toast({ title: "Factura generada 📄" });
    setShowSuccess(false);
  };

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col lg:flex-row gap-4">
      {/* Left: Items Grid */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Stylist Selection - iOS Style */}
        <div className="mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {stylists.map((stylist) => (
              <motion.button
                key={stylist.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedStylistId(stylist.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  selectedStylistId === stylist.id 
                    ? "bg-primary text-primary-foreground shadow-lg" 
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: stylist.color || "#8B5CF6" }} 
                />
                {stylist.name}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                activeCategory === cat 
                  ? "bg-foreground text-background" 
                  : "bg-muted/50 hover:bg-muted"
              }`}
            >
              {cat === "all" ? "Todo" : cat}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {/* Manual Entry Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowManualInput(true)}
              className="aspect-square rounded-2xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              <PenLine className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Manual</span>
            </motion.button>

            {filteredItems.map((item) => {
              const isSelected = selectedItems.some(s => s.id === item.id);
              const isProduct = "stock" in item;
              return (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleItem(item)}
                  className={`aspect-square rounded-2xl p-3 flex flex-col items-center justify-center gap-1 transition-all relative overflow-hidden ${
                    isSelected 
                      ? "bg-primary text-primary-foreground shadow-lg ring-2 ring-primary ring-offset-2" 
                      : "bg-muted/50 hover:bg-muted"
                  }`}
                >
                  {isProduct && (
                    <Package className="h-4 w-4 absolute top-2 right-2 opacity-50" />
                  )}
                  <span className="text-xs text-center font-medium line-clamp-2">{item.name}</span>
                  <span className={`text-sm font-bold ${isSelected ? "" : "text-primary"}`}>
                    {item.price ? formatCurrency(item.price) : "—"}
                  </span>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-1 left-1"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: Cart & Payment */}
      <div className="w-full lg:w-80 flex flex-col bg-background rounded-2xl border shadow-sm">
        {/* Customer Input */}
        <div className="p-4 border-b space-y-2">
          <Input 
            value={customerName} 
            onChange={(e) => setCustomerName(e.target.value)} 
            placeholder="Nombre cliente"
            className="bg-muted/50 border-0 text-center font-medium"
          />
          <Input 
            type="email"
            value={customerEmail} 
            onChange={(e) => setCustomerEmail(e.target.value)} 
            placeholder="Email (opcional)"
            className="bg-muted/50 border-0 text-center text-sm"
          />
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
          <AnimatePresence>
            {selectedItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-2 p-2 rounded-xl bg-muted/30"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(item.price)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, -1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-5 text-center text-sm font-medium">{item.quantity}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <span className="text-sm font-bold w-16 text-right">
                  {formatCurrency(item.price * item.quantity)}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => removeItem(item.id)}>
                  <X className="h-3 w-3" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>

          {selectedItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Scissors className="h-12 w-12 mb-2 opacity-30" />
              <p className="text-sm">Selecciona servicios</p>
            </div>
          )}
        </div>

        {/* Extras (Discount & Tip) */}
        {selectedItems.length > 0 && (
          <div className="px-4 pb-2 flex gap-2">
            <Button 
              variant={showDiscount ? "default" : "outline"} 
              size="sm" 
              className="flex-1 gap-1"
              onClick={() => setShowDiscount(!showDiscount)}
            >
              <Percent className="h-3 w-3" />
              {discountAmount > 0 ? `-${formatCurrency(discountAmount)}` : "Descuento"}
            </Button>
            <Button 
              variant={showTip ? "default" : "outline"} 
              size="sm" 
              className="flex-1 gap-1"
              onClick={() => setShowTip(!showTip)}
            >
              <Heart className="h-3 w-3" />
              {tip > 0 ? `+${formatCurrency(tip)}` : "Propina"}
            </Button>
          </div>
        )}

        {showDiscount && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="px-4 pb-2 space-y-2"
          >
            <div className="flex gap-2">
              <Button 
                variant={discountType === "percentage" ? "default" : "outline"} 
                size="sm" 
                className="flex-1"
                onClick={() => setDiscountType("percentage")}
              >
                %
              </Button>
              <Button 
                variant={discountType === "fixed" ? "default" : "outline"} 
                size="sm" 
                className="flex-1"
                onClick={() => setDiscountType("fixed")}
              >
                €
              </Button>
              <Input 
                type="number" 
                value={discountValue} 
                onChange={(e) => setDiscountValue(e.target.value)} 
                placeholder="0"
                className="w-20 text-center"
              />
            </div>
          </motion.div>
        )}

        {showTip && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="px-4 pb-2"
          >
            <div className="flex gap-2">
              {[1, 2, 5, 10].map((v) => (
                <Button 
                  key={v} 
                  variant={parseFloat(tipAmount) === v ? "default" : "outline"} 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setTipAmount(v.toString())}
                >
                  {v}€
                </Button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Totals */}
        <div className="p-4 border-t bg-muted/30 space-y-1">
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-orange-600">
              <span>Descuento</span>
              <span>-{formatCurrency(discountAmount)}</span>
            </div>
          )}
          {tip > 0 && (
            <div className="flex justify-between text-sm text-pink-600">
              <span>Propina</span>
              <span>+{formatCurrency(tip)}</span>
            </div>
          )}
          <div className="flex justify-between text-2xl font-bold pt-1">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(grandTotal)}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="p-4 border-t space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "cash" as const, icon: Banknote, label: "Efectivo" },
              { value: "card" as const, icon: CreditCard, label: "Tarjeta" },
              { value: "mixed" as const, icon: null, label: "Mixto" },
            ].map(({ value, icon: Icon, label }) => (
              <Button
                key={value}
                variant={paymentMethod === value ? "default" : "outline"}
                className="h-12 flex-col gap-0.5"
                onClick={() => setPaymentMethod(value)}
              >
                {Icon ? <Icon className="h-4 w-4" /> : <div className="flex"><Banknote className="h-3 w-3" /><CreditCard className="h-3 w-3" /></div>}
                <span className="text-[10px]">{label}</span>
              </Button>
            ))}
          </div>

          {paymentMethod === "mixed" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Efectivo</Label>
                <Input 
                  type="number" 
                  value={cashAmount} 
                  onChange={(e) => setCashAmount(e.target.value)} 
                  placeholder="0"
                  className="text-center"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Tarjeta</Label>
                <Input 
                  type="number" 
                  value={cardAmount} 
                  onChange={(e) => setCardAmount(e.target.value)} 
                  placeholder="0"
                  className="text-center"
                />
              </div>
            </div>
          )}

          {(paymentMethod === "cash" || (paymentMethod === "mixed" && numericCashAmount > 0)) && (
            <div>
              <Label className="text-xs text-muted-foreground">Entregado</Label>
              <Input 
                type="number" 
                value={cashGiven} 
                onChange={(e) => setCashGiven(e.target.value)} 
                placeholder="0"
                className="text-center text-lg font-bold"
              />
              {getChange() > 0 && (
                <p className="text-center text-lg font-bold text-green-600 mt-1">
                  Cambio: {formatCurrency(getChange())}
                </p>
              )}
            </div>
          )}

          {/* Invoice checkbox - VISIBLE IN CART */}
          <div className="flex items-center space-x-2 p-3 rounded-lg bg-muted/50 border">
            <Checkbox 
              id="wants-invoice-cart" 
              checked={wantsInvoice}
              onCheckedChange={(checked) => setWantsInvoice(checked === true)}
            />
            <label 
              htmlFor="wants-invoice-cart" 
              className="text-sm font-medium cursor-pointer flex items-center gap-2 flex-1"
            >
              <FileText className="h-4 w-4" />
              Generar factura
            </label>
          </div>

          {/* Invoice data form - VISIBLE IN CART */}
          <AnimatePresence>
            {wantsInvoice && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-2 overflow-hidden"
              >
                <Input 
                  placeholder="Nombre fiscal / Razón social *"
                  value={invoiceData.fiscalName}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, fiscalName: e.target.value }))}
                  className="text-sm"
                />
                <Input 
                  placeholder="NIF / CIF *"
                  value={invoiceData.nif}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, nif: e.target.value }))}
                  className="text-sm"
                />
                <Input 
                  placeholder="Dirección fiscal"
                  value={invoiceData.fiscalAddress}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, fiscalAddress: e.target.value }))}
                  className="text-sm"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <Button 
            onClick={handleSubmit} 
            disabled={loading || selectedItems.length === 0 || !selectedStylistId || (wantsInvoice && (!invoiceData.fiscalName || !invoiceData.nif))} 
            className="w-full h-14 text-lg font-bold gap-2"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" />
                Cobrar {formatCurrency(grandTotal)}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Manual Input Dialog */}
      <Dialog open={showManualInput} onOpenChange={setShowManualInput}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Importe manual</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input 
              value={manualItemName} 
              onChange={(e) => setManualItemName(e.target.value)} 
              placeholder="Concepto"
            />
            <Input 
              type="number" 
              value={manualItemPrice} 
              onChange={(e) => setManualItemPrice(e.target.value)} 
              placeholder="0.00"
              className="text-center text-2xl font-bold"
            />
            <Button onClick={addManualItem} className="w-full">
              Añadir
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-sm">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mx-auto w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4"
          >
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </motion.div>
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl">¡Cobro realizado!</DialogTitle>
          </DialogHeader>
          <p className="text-3xl font-bold text-primary text-center">
            {lastTransaction && formatCurrency(lastTransaction.grandTotal)}
          </p>
          
          <div className="mt-4 space-y-3">
            {/* Show invoice download button if invoice was requested */}
            {lastTransaction?.wantsInvoice && (
              <Button 
                onClick={downloadInvoicePdf}
                className="w-full gap-2"
              >
                <Download className="h-4 w-4" />
                Descargar factura
              </Button>
            )}

            {/* Email ticket option */}
            <div className="space-y-2">
              <Input 
                type="email"
                placeholder="Email para ticket (opcional)"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="text-center text-sm"
              />
              {(customerEmail || lastTransaction?.customerEmail) && (
                <Button 
                  onClick={sendTicketEmail} 
                  disabled={sendingEmail}
                  variant="outline"
                  className="w-full gap-2"
                >
                  {sendingEmail ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  Enviar ticket por email
                </Button>
              )}
            </div>
          </div>
          
          <Button onClick={() => setShowSuccess(false)} variant="outline" className="w-full mt-2">
            Nuevo cobro
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};
