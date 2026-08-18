import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  Loader2,
  Banknote,
  CreditCard,
  CheckCircle2,
  Percent,
  Heart,
  User,
  X,
  Plus,
  Minus,
  Package,
  PenLine,
  Mail,
  Sparkles,
  Download,
  Calendar,
  Clock,
  Search,
  ChevronRight,
  Copy,
  MessageCircle,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { format } from "date-fns";

interface TodayBooking {
  id: string;
  customer_name: string;
  Telefono: string;
  Hora: string;
  stylist: string;
  services: any;
  notes: string | null;
}

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
  min_stock: number;
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
  const [search, setSearch] = useState("");
  const [payOpen, setPayOpen] = useState(false);

  // Invoice data state kept for internal logic but UI removed as requested
  const [wantsInvoice, setWantsInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState({
    fiscalName: "",
    nif: "",
    fiscalAddress: "",
  });
  const [tenantData, setTenantData] = useState<any>(null);
  const [savedFiscalData, setSavedFiscalData] = useState<any[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<string[]>([]);
  
  // Today's bookings for quick charge
  const [todayBookings, setTodayBookings] = useState<TodayBooking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const { toast } = useToast();

  // Si se vacía el carrito desde la hoja, no tiene sentido dejarla abierta
  useEffect(() => {
    if (payOpen && selectedItems.length === 0) setPayOpen(false);
  }, [payOpen, selectedItems.length]);

  useEffect(() => {
    fetchData();
    fetchSavedFiscalData();
    fetchTodayBookings();
  }, [tenantId]);

  // Check for pending booking AFTER services are loaded
  useEffect(() => {
    if (services.length > 0 && stylists.length > 0) {
      const pendingBooking = sessionStorage.getItem('pendingChargeBooking');
      if (pendingBooking) {
        try {
          const booking = JSON.parse(pendingBooking);
          loadBookingData(booking, services, stylists);
          sessionStorage.removeItem('pendingChargeBooking');
        } catch (e) {
          console.error('Error parsing pending booking:', e);
          sessionStorage.removeItem('pendingChargeBooking');
        }
      }
    }
  }, [services, stylists]);

  const fetchTodayBookings = async () => {
    setLoadingBookings(true);
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      
      // Get confirmed bookings for today
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("id, customer_name, Telefono, Hora, stylist, services, notes")
        .eq("tenant_id", tenantId)
        .eq("Fecha", today)
        .eq("status", "confirmed")
        .order("Hora", { ascending: true });
      
      if (bookingsError) throw bookingsError;
      
      // Get already charged bookings
      const { data: chargedData } = await supabase
        .from("transactions")
        .select("booking_id")
        .eq("tenant_id", tenantId)
        .not("booking_id", "is", null);
      
      const chargedIds = new Set((chargedData || []).map(t => t.booking_id));
      
      // Filter out already charged, completed and blocked bookings
      const pendingBookings = (bookingsData || []).filter(b => {
        const isCharged = chargedIds.has(b.id);
        const isCompleted = b.notes?.includes('[✓ COMPLETADA]') || b.notes?.includes('[💳 COBRADA]');
        const isBlocked = b.customer_name.includes('BLOQUEADO') || b.customer_name.includes('VACACIONES');
        return !isCharged && !isCompleted && !isBlocked;
      });
      
      setTodayBookings(pendingBookings);
    } catch (error) {
      console.error('Error fetching today bookings:', error);
    } finally {
      setLoadingBookings(false);
    }
  };

  const loadBookingData = (booking: any, servicesList?: Service[], stylistsList?: Stylist[]) => {
    const svcList = servicesList || services;
    const stList = stylistsList || stylists;
    
    // Clear current selection first
    setSelectedItems([]);
    setSelectedStylistId("");
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
    
    // Set customer name
    setCustomerName(booking.customer_name || "Cliente");
    
    // Find and preselect stylist
    const matchedStylist = stList.find(s => s.slug === booking.stylist);
    if (matchedStylist) {
      setSelectedStylistId(matchedStylist.id);
    }
    
    // Load services from booking with prices
    if (Array.isArray(booking.services)) {
      const bookingServices: SelectedItem[] = booking.services.map((s: any, idx: number) => {
        // Find the actual service to get the correct price
        const realService = svcList.find(srv => srv.id === s.id || srv.name === s.name);
        const price = realService?.price ?? s.price ?? 0;
        
        console.log('Mapping service:', s.name, 'Found:', realService?.name, 'Price:', price);
        
        return {
          id: s.id || `booking-${Date.now()}-${idx}`,
          name: s.name,
          price: price,
          quantity: 1,
          type: "service" as const
        };
      });
      setSelectedItems(bookingServices);
    }
    
    setSelectedBookingId(booking.id);
    
    toast({
      title: "Cita cargada",
      description: `Servicios de ${booking.customer_name} listos para cobrar`,
    });
  };

  useEffect(() => {
    if (customerName.trim() && wantsInvoice) {
      const match = savedFiscalData.find((f) => f.customer_name.toLowerCase() === customerName.trim().toLowerCase());
      if (match) {
        setInvoiceData({
          fiscalName: match.fiscal_name || "",
          nif: match.nif || "",
          fiscalAddress: match.fiscal_address || "",
        });
      }
    }
  }, [customerName, wantsInvoice, savedFiscalData]);

  const fetchSavedFiscalData = async () => {
    // Fiscal data functionality removed - no longer saving customer fiscal data
    setSavedFiscalData([]);
  };

  const fetchData = async () => {
    try {
      const [servicesRes, stylistsRes, productsRes, tenantRes] = await Promise.all([
        supabase
          .from("services")
          .select("id, name, price, category")
          .eq("tenant_id", tenantId)
          .order("category")
          .order("name"),
        supabase
          .from("tenant_stylists")
          .select("id, name, slug, color")
          .eq("tenant_id", tenantId)
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("products")
          .select("id, name, price, category, stock, min_stock")
          .eq("tenant_id", tenantId)
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("tenants")
          .select("name, logo_url, address, city, postal_code, phone, email")
          .eq("id", tenantId)
          .single(),
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
    return discountType === "percentage" ? Math.min((subtotal * value) / 100, subtotal) : Math.min(value, subtotal);
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

  const categories = [
    "all",
    ...new Set([
      ...services.map((s) => s.category || "Otros"),
      ...products.map((p) => `📦 ${p.category || "Productos"}`),
    ]),
  ];

  const byCategory =
    activeCategory === "all"
      ? [...services, ...products.map((p) => ({ ...p, category: `📦 ${p.category || "Productos"}` }))]
      : activeCategory.startsWith("📦")
        ? products.filter((p) => `📦 ${p.category || "Productos"}` === activeCategory)
        : services.filter((s) => (s.category || "Otros") === activeCategory);

  const query = search.trim().toLowerCase();
  const filteredItems = query
    ? byCategory.filter((i) => i.name.toLowerCase().includes(query))
    : byCategory;

  const itemCount = selectedItems.reduce((n, i) => n + i.quantity, 0);
  const selectedStylist = stylists.find((s) => s.id === selectedStylistId);

  const toggleItem = (item: Service | Product) => {
    const isProduct = "stock" in item;
    const existing = selectedItems.find((s) => s.id === item.id);

    if (existing) {
      setSelectedItems(selectedItems.filter((s) => s.id !== item.id));
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          id: item.id,
          name: item.name,
          price: item.price || 0,
          quantity: 1,
          type: isProduct ? "product" : "service",
        },
      ]);
    }
  };

  const addManualItem = () => {
    if (!manualItemName.trim() || !manualItemPrice) return;
    const price = parseFloat(manualItemPrice) || 0;
    if (price <= 0) return;

    setSelectedItems([
      ...selectedItems,
      {
        id: `manual-${Date.now()}`,
        name: manualItemName.trim(),
        price,
        quantity: 1,
        type: "manual",
      },
    ]);
    setManualItemName("");
    setManualItemPrice("");
    setShowManualInput(false);
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setSelectedItems(
      selectedItems.map((s) => (s.id === itemId ? { ...s, quantity: Math.max(1, s.quantity + delta) } : s)),
    );
  };

  const removeItem = (itemId: string) => {
    setSelectedItems(selectedItems.filter((s) => s.id !== itemId));
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
    setSelectedBookingId(null);
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const selectedStylist = stylists.find((s) => s.id === selectedStylistId);
      const servicesData = selectedItems.map((s) => ({
        id: s.id,
        name: s.name,
        price: s.price,
        quantity: s.quantity,
        total: s.price * s.quantity,
        type: s.type,
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
        booking_id: selectedBookingId || null,
      };

      const { data: inserted, error } = await supabase
        .from("transactions")
        .insert(transactionData as never)
        .select("id")
        .single();
      if (error) throw error;

      // Email de la clienta: el escrito a mano manda; si no, lo buscamos en su
      // ficha (por teléfono de la cita o por nombre) para enviarlo solo.
      let resolvedEmail = customerEmail.trim();
      if (!resolvedEmail) {
        try {
          const booking = todayBookings.find((b) => b.id === selectedBookingId);
          let clientQuery = supabase
            .from("clients")
            .select("email")
            .eq("tenant_id", tenantId)
            .not("email", "is", null)
            .limit(1);
          if (booking?.Telefono) {
            clientQuery = clientQuery.eq("phone", booking.Telefono);
          } else if (customerName.trim()) {
            clientQuery = clientQuery.ilike("name", customerName.trim());
          } else {
            clientQuery = null as never;
          }
          if (clientQuery) {
            const { data: client } = await clientQuery.maybeSingle();
            if (client?.email) resolvedEmail = client.email;
          }
        } catch (clientError) {
          console.error("client email lookup", clientError);
        }
      }

      // Enlace de valoración de un solo uso: la clienta de mostrador no tiene
      // cuenta, así que el permiso se lo da este token, no una sesión.
      let reviewUrl: string | null = null;
      try {
        const { data: invite } = await supabase
          .from("review_invites")
          .insert({
            tenant_id: tenantId,
            transaction_id: (inserted as any)?.id ?? null,
            booking_id: selectedBookingId || null,
            customer_name: customerName.trim() || null,
            customer_email: resolvedEmail || null,
          })
          .select("token")
          .single();
        if (invite?.token) reviewUrl = `${window.location.origin}/valorar/${invite.token}`;
      } catch (inviteError) {
        // Que falle la invitación no puede tumbar el cobro
        console.error("review invite", inviteError);
      }


      // If this was from a booking, mark it as completed and charged
      if (selectedBookingId) {
        const today = new Date().toLocaleDateString('es-ES');
        await supabase
          .from("bookings")
          .update({ 
            notes: `[✓ COMPLETADA] [💳 COBRADA] ${today}`,
            status: "confirmed" // Keep as confirmed, the notes indicate completion
          })
          .eq("id", selectedBookingId);
        
        // Refresh today's bookings list
        fetchTodayBookings();
      }

      // Reduce stock for products and check for low stock
      const productItems = selectedItems.filter((item) => item.type === "product");
      const alerts: string[] = [];
      for (const item of productItems) {
        const product = products.find((p) => p.id === item.id);
        if (product) {
          const newStock = product.stock - item.quantity;
          await supabase.from("products").update({ stock: newStock }).eq("id", item.id);
          if (newStock <= product.min_stock) {
            alerts.push(`${product.name}: ${newStock} uds`);
          }
        }
      }
      if (alerts.length > 0) {
        setLowStockAlerts(alerts);
        toast({
          title: "⚠️ Stock bajo",
          description: alerts.join(", "),
          variant: "destructive",
        });
      }

      // Fiscal data is no longer saved to database

      setLastTransaction({
        ...transactionData,
        stylistName: selectedStylist?.name || "Estilista",
        items: servicesData,
        grandTotal,
        customerEmail,
        wantsInvoice,
        invoiceData,
        reviewUrl,
      });

      setPayOpen(false);
      setShowSuccess(true);
      clearAll();
      onTransactionCreated();
      fetchData(); // Refresh products to show updated stock
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
          reviewUrl: lastTransaction.reviewUrl || undefined,
          date: new Date().toLocaleDateString("es-ES", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
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

    // IMPORTANT: Open the window synchronously to avoid popup blockers.
    const invoiceWindow = window.open("", "_blank");
    if (!invoiceWindow) {
      toast({
        title: "No se pudo abrir la factura",
        description: "Permite las ventanas emergentes para descargar/imprimir la factura.",
        variant: "destructive",
      });
      return;
    }

    const invoiceNumber = `FAC-${Date.now().toString(36).toUpperCase()}`;
    const invoiceDate = new Date().toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // Invoice is printed but not saved to database (invoices table removed)

    const itemsHtml = lastTransaction.items
      .map(
        (item: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: right;">${formatCurrency(item.price)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: right;">${formatCurrency(item.total)}</td>
      </tr>
    `,
      )
      .join("");

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
            ${
              lastTransaction.discount > 0
                ? `
              <div class="totals-row discount">
                <span>Descuento</span>
                <span>-${formatCurrency(lastTransaction.discount)}</span>
              </div>
            `
                : ""
            }
            ${
              lastTransaction.tip_amount > 0
                ? `
              <div class="totals-row tip">
                <span>Propina</span>
                <span>+${formatCurrency(lastTransaction.tip_amount)}</span>
              </div>
            `
                : ""
            }
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

    invoiceWindow.document.open();
    invoiceWindow.document.write(invoiceHtml);
    invoiceWindow.document.close();
    invoiceWindow.focus();

    // Give the browser a tick to paint before printing.
    setTimeout(() => {
      try {
        invoiceWindow.print();
      } catch {
        // ignore
      }
    }, 250);

    toast({ title: "Factura generada" });
    setShowSuccess(false);
  };

  return (
    <div className="font-body">
      {/* ── CATÁLOGO ─────────────────────────────────────────── */}

      {/* Citas de hoy sin cobrar */}
      {todayBookings.length > 0 && (
        <section className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span className="text-[13px] font-semibold text-ink-2">Citas de hoy sin cobrar</span>
            <span className="text-[11px] font-bold text-primary bg-primary/10 rounded-full px-1.5">
              {todayBookings.length}
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
            {todayBookings.map((booking) => {
              const isSelected = selectedBookingId === booking.id;
              const servicesText = Array.isArray(booking.services)
                ? booking.services.map((s: any) => s.name || s).join(", ")
                : "";
              return (
                <button
                  key={booking.id}
                  onClick={() => loadBookingData(booking, services, stylists)}
                  className={`shrink-0 w-[150px] text-left rounded-2xl border px-3 py-2.5 transition-colors ${
                    isSelected
                      ? "border-primary/50 bg-primary/[0.06]"
                      : "border-line bg-surface min-[920px]:hover:border-primary/30"
                  }`}
                >
                  <span className="flex items-center gap-1 text-[11px] font-bold text-outline tabular-nums">
                    <Clock className="w-3 h-3" />
                    {booking.Hora.slice(0, 5)}
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary ml-auto" />}
                  </span>
                  <span className="block text-[14px] font-semibold text-ink-2 truncate mt-0.5 tracking-[-0.01em]">
                    {booking.customer_name}
                  </span>
                  <span className="block text-[11px] text-outline truncate">{servicesText}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Buscador */}
      <div className="flex items-center gap-2.5 rounded-2xl bg-chip px-3.5 h-11 mb-3">
        <Search className="w-4 h-4 text-outline flex-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar servicio o producto"
          className="flex-1 min-w-0 bg-transparent text-[15px] outline-none text-ink-2 placeholder:text-outline/70"
        />
        {search && (
          <button onClick={() => setSearch("")} aria-label="Limpiar búsqueda" className="flex-none">
            <X className="w-4 h-4 text-outline" />
          </button>
        )}
      </div>

      {/* Categorías */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1 pb-3">
        {categories.map((cat) => {
          const on = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold whitespace-nowrap transition-colors ${
                on ? "bg-gradient-brand text-white" : "bg-chip text-ink-2"
              }`}
            >
              {cat === "all" ? "Todo" : cat}
            </button>
          );
        })}
      </div>

      {/* Rejilla de servicios y productos */}
      <div className="grid grid-cols-2 min-[560px]:grid-cols-3 min-[920px]:grid-cols-4 gap-2">
        <button
          onClick={() => setShowManualInput(true)}
          className="rounded-2xl border border-dashed border-outline/35 flex flex-col items-center justify-center gap-1 py-4 min-[920px]:hover:border-primary/40 transition-colors"
        >
          <PenLine className="w-4 h-4 text-outline" />
          <span className="text-[12px] font-semibold text-outline">Importe manual</span>
        </button>

        {filteredItems.map((item) => {
          const picked = selectedItems.find((s) => s.id === item.id);
          const isProduct = "stock" in item;
          return (
            <button
              key={item.id}
              onClick={() => toggleItem(item)}
              className={`relative text-left rounded-2xl border px-3 py-2.5 transition-colors ${
                picked
                  ? "border-primary bg-primary/[0.06]"
                  : "border-line bg-surface min-[920px]:hover:border-primary/30"
              }`}
            >
              {isProduct && (
                <Package className="w-3 h-3 text-outline/60 absolute top-2 right-2" />
              )}
              {picked && (
                <span className="absolute top-2 right-2 text-[11px] font-bold text-primary tabular-nums">
                  ×{picked.quantity}
                </span>
              )}
              <span className="block text-[13px] font-semibold text-ink-2 leading-tight line-clamp-2 pr-4">
                {item.name}
              </span>
              <span className="block text-[13px] font-bold text-primary tabular-nums mt-1">
                {item.price ? formatCurrency(item.price) : "—"}
              </span>
            </button>
          );
        })}

        {filteredItems.length === 0 && (
          <p className="col-span-full text-center text-[13px] text-outline py-8">
            Nada coincide con «{search}»
          </p>
        )}
      </div>

      {/* ── BARRA DE CARRITO ─────────────────────────────────
          Flota sobre el contenido en móvil (encima de la nav) y
          en escritorio se queda al final del catálogo. */}
      {selectedItems.length > 0 && (
        <>
          <div className="h-24 min-[920px]:h-0" />
          <div
            className="fixed left-0 right-0 z-30 px-3 min-[920px]:static min-[920px]:px-0 min-[920px]:mt-4"
            style={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}
          >
            <div
              className="flex items-center gap-3 rounded-2xl bg-surface border border-line px-4 py-3"
              style={{ boxShadow: "0 2px 6px rgba(20,22,40,.08), 0 18px 40px -20px rgba(20,22,40,.5)" }}
            >
              <button onClick={clearAll} aria-label="Vaciar carrito" className="flex-none text-outline">
                <X className="w-4 h-4" />
              </button>
              <span className="flex-1 min-w-0">
                <span className="block text-[18px] font-bold text-ink-2 tabular-nums leading-tight">
                  {formatCurrency(grandTotal)}
                </span>
                <span className="block text-[11px] text-outline truncate">
                  {itemCount} {itemCount === 1 ? "línea" : "líneas"}
                  {selectedStylist ? ` · ${selectedStylist.name}` : ""}
                </span>
              </span>
              <button
                onClick={() => setPayOpen(true)}
                className="flex-none h-11 rounded-full bg-gradient-brand text-white text-[15px] font-semibold px-5 inline-flex items-center gap-1 active:scale-95 transition-transform"
                style={{ boxShadow: "0 8px 22px -10px rgba(34,64,140,.6)" }}
              >
                Cobrar
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── HOJA DE COBRO ────────────────────────────────────── */}
      <Sheet open={payOpen} onOpenChange={setPayOpen}>
        <SheetContent
          side="bottom"
          className="h-[92vh] p-0 rounded-t-[28px] border-0 bg-background/95 backdrop-blur-xl flex flex-col"
        >
          <div className="shrink-0 pt-2.5 px-5 pb-3 border-b border-line">
            <div className="mx-auto h-1.5 w-10 rounded-full bg-outline/25 mb-3" />
            <p className="text-[11px] font-semibold text-outline">Total a cobrar</p>
            <p className="text-[28px] font-bold text-ink-2 tabular-nums leading-none mt-0.5">
              {formatCurrency(grandTotal)}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {/* Líneas */}
            <section className="space-y-2">
              <label className="text-[13px] font-semibold text-ink-2">Detalle</label>
              <div className="rounded-2xl bg-surface border border-line overflow-hidden">
                {selectedItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-2 px-3.5 py-2.5 ${idx > 0 ? "border-t border-line" : ""}`}
                  >
                    <span className="flex-1 min-w-0">
                      <span className="block text-[14px] font-medium text-ink-2 truncate">
                        {item.name}
                      </span>
                      <span className="block text-[11px] text-outline tabular-nums">
                        {formatCurrency(item.price)}
                      </span>
                    </span>
                    <span className="flex items-center gap-1 flex-none">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        aria-label="Quitar uno"
                        className="w-7 h-7 rounded-full bg-chip flex items-center justify-center text-ink-2 active:scale-90 transition-transform"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center text-[14px] font-semibold tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        aria-label="Añadir uno"
                        className="w-7 h-7 rounded-full bg-chip flex items-center justify-center text-ink-2 active:scale-90 transition-transform"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </span>
                    <span className="w-16 text-right text-[14px] font-bold text-ink-2 tabular-nums flex-none">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                    <button
                      onClick={() => removeItem(item.id)}
                      aria-label={`Quitar ${item.name}`}
                      className="flex-none text-outline"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {(discountAmount > 0 || tip > 0) && (
                <div className="px-1 space-y-1">
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-[13px] font-semibold text-warning">
                      <span>Descuento</span>
                      <span className="tabular-nums">-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  {tip > 0 && (
                    <div className="flex justify-between text-[13px] font-semibold text-accent">
                      <span>Propina</span>
                      <span className="tabular-nums">+{formatCurrency(tip)}</span>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Descuento y propina */}
            <section className="space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDiscount(!showDiscount)}
                  className={`flex-1 h-10 rounded-full text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                    showDiscount || discountAmount > 0
                      ? "bg-gradient-brand text-white"
                      : "bg-chip text-ink-2"
                  }`}
                >
                  <Percent className="w-3.5 h-3.5" />
                  {discountAmount > 0 ? `-${formatCurrency(discountAmount)}` : "Descuento"}
                </button>
                <button
                  onClick={() => setShowTip(!showTip)}
                  className={`flex-1 h-10 rounded-full text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                    showTip || tip > 0 ? "bg-gradient-brand text-white" : "bg-chip text-ink-2"
                  }`}
                >
                  <Heart className="w-3.5 h-3.5" />
                  {tip > 0 ? `+${formatCurrency(tip)}` : "Propina"}
                </button>
              </div>

              {showDiscount && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setDiscountType("percentage")}
                    className={`w-12 h-10 rounded-2xl text-[14px] font-bold ${
                      discountType === "percentage" ? "bg-primary text-white" : "bg-chip text-ink-2"
                    }`}
                  >
                    %
                  </button>
                  <button
                    onClick={() => setDiscountType("fixed")}
                    className={`w-12 h-10 rounded-2xl text-[14px] font-bold ${
                      discountType === "fixed" ? "bg-primary text-white" : "bg-chip text-ink-2"
                    }`}
                  >
                    €
                  </button>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder="0"
                    className="flex-1 min-w-0 h-10 rounded-2xl bg-chip px-3 text-[15px] text-center tabular-nums outline-none text-ink-2"
                  />
                </div>
              )}

              {showTip && (
                <div className="flex gap-2">
                  {[1, 2, 5, 10].map((v) => (
                    <button
                      key={v}
                      onClick={() => setTipAmount(parseFloat(tipAmount) === v ? "" : v.toString())}
                      className={`flex-1 h-10 rounded-2xl text-[14px] font-semibold tabular-nums ${
                        parseFloat(tipAmount) === v ? "bg-primary text-white" : "bg-chip text-ink-2"
                      }`}
                    >
                      {v}€
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Método de pago */}
            <section className="space-y-2">
              <label className="text-[13px] font-semibold text-ink-2">Cómo paga</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "cash" as const, icon: Banknote, label: "Efectivo" },
                  { value: "card" as const, icon: CreditCard, label: "Tarjeta" },
                  { value: "mixed" as const, icon: Sparkles, label: "Mixto" },
                ].map(({ value, icon: Icon, label }) => {
                  const on = paymentMethod === value;
                  return (
                    <button
                      key={value}
                      onClick={() => setPaymentMethod(value)}
                      className={`h-16 rounded-2xl flex flex-col items-center justify-center gap-1 transition-colors ${
                        on ? "bg-gradient-brand text-white" : "bg-chip text-ink-2"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[12px] font-semibold">{label}</span>
                    </button>
                  );
                })}
              </div>

              {paymentMethod === "mixed" && (
                <div className="grid grid-cols-2 gap-2">
                  <label className="rounded-2xl bg-surface border border-line px-3.5 py-2">
                    <span className="block text-[11px] font-semibold text-outline">Efectivo</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      placeholder="0"
                      className="w-full bg-transparent text-[16px] font-semibold tabular-nums outline-none text-ink-2"
                    />
                  </label>
                  <label className="rounded-2xl bg-surface border border-line px-3.5 py-2">
                    <span className="block text-[11px] font-semibold text-outline">Tarjeta</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={cardAmount}
                      onChange={(e) => setCardAmount(e.target.value)}
                      placeholder="0"
                      className="w-full bg-transparent text-[16px] font-semibold tabular-nums outline-none text-ink-2"
                    />
                  </label>
                  {getMixedRemaining() > 0.01 && (
                    <p className="col-span-2 text-[12px] font-semibold text-destructive text-center">
                      Faltan {formatCurrency(getMixedRemaining())}
                    </p>
                  )}
                </div>
              )}

              {(paymentMethod === "cash" || (paymentMethod === "mixed" && numericCashAmount > 0)) && (
                <>
                  <label className="flex items-center justify-between rounded-2xl bg-surface border border-line px-3.5 py-2.5">
                    <span className="text-[13px] font-semibold text-outline">Entrega</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={cashGiven}
                      onChange={(e) => setCashGiven(e.target.value)}
                      placeholder="0"
                      className="w-28 bg-transparent text-[18px] font-bold tabular-nums text-right outline-none text-ink-2"
                    />
                  </label>
                  {getChange() > 0 && (
                    <div className="flex items-center justify-between rounded-2xl bg-success-soft px-3.5 py-2.5">
                      <span className="text-[13px] font-semibold text-success">Cambio</span>
                      <span className="text-[18px] font-bold text-success tabular-nums">
                        {formatCurrency(getChange())}
                      </span>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* Estilista */}
            <section className="space-y-2">
              <label className="text-[13px] font-semibold text-ink-2">Atendido por</label>
              <div className="grid grid-cols-2 gap-2">
                {stylists.map((stylist) => {
                  const on = selectedStylistId === stylist.id;
                  return (
                    <button
                      key={stylist.id}
                      onClick={() => setSelectedStylistId(stylist.id)}
                      className={`h-11 rounded-2xl inline-flex items-center justify-center gap-2 text-[13px] font-semibold transition-colors ${
                        on ? "bg-gradient-brand text-white" : "bg-chip text-ink-2"
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-none"
                        style={{ background: on ? "#fff" : stylist.color || "#8B5CF6" }}
                      />
                      <span className="truncate">{stylist.name}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Cliente */}
            <section className="space-y-2">
              <label className="text-[13px] font-semibold text-ink-2">Cliente (opcional)</label>
              <div className="rounded-2xl bg-surface border border-line overflow-hidden">
                <div className="flex items-center gap-2.5 px-3.5 py-3">
                  <User className="w-4 h-4 text-outline flex-none" />
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nombre"
                    className="flex-1 min-w-0 bg-transparent text-[15px] outline-none text-ink-2"
                  />
                </div>
                <div className="flex items-center gap-2.5 px-3.5 py-3 border-t border-line">
                  <Mail className="w-4 h-4 text-outline flex-none" />
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Email para el ticket"
                    className="flex-1 min-w-0 bg-transparent text-[15px] outline-none text-ink-2"
                  />
                </div>
              </div>
            </section>
          </div>

          <div
            className="shrink-0 border-t border-line px-5 pt-3.5 bg-background/95 backdrop-blur-xl"
            style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
          >
            <button
              onClick={handleSubmit}
              disabled={loading || selectedItems.length === 0 || !selectedStylistId}
              className="w-full h-12 rounded-full bg-gradient-brand text-white text-[15px] font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[.99] transition-transform"
              style={{ boxShadow: "0 8px 22px -10px rgba(34,64,140,.6)" }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar cobro · {formatCurrency(grandTotal)}
                </>
              )}
            </button>
            {!selectedStylistId && (
              <p className="text-center text-[11px] text-outline mt-2">
                Elige quién ha atendido para poder cobrar
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Importe manual */}
      <Dialog open={showManualInput} onOpenChange={setShowManualInput}>
        <DialogContent className="max-w-xs rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-[18px]">Importe manual</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <input
              value={manualItemName}
              onChange={(e) => setManualItemName(e.target.value)}
              placeholder="Concepto"
              className="w-full h-11 rounded-2xl bg-chip px-3.5 text-[15px] outline-none text-ink-2"
            />
            <input
              type="number"
              inputMode="decimal"
              value={manualItemPrice}
              onChange={(e) => setManualItemPrice(e.target.value)}
              placeholder="0,00"
              className="w-full h-14 rounded-2xl bg-chip px-3.5 text-[24px] font-bold text-center tabular-nums outline-none text-ink-2"
            />
            <button
              onClick={addManualItem}
              className="w-full h-11 rounded-full bg-gradient-brand text-white text-[15px] font-semibold"
            >
              Añadir
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cobro hecho */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-sm rounded-3xl text-center">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-auto w-16 h-16 rounded-full bg-success-soft flex items-center justify-center"
          >
            <CheckCircle2 className="w-8 h-8 text-success" />
          </motion.div>
          <DialogHeader>
            <DialogTitle className="text-[20px] text-center">Cobro registrado</DialogTitle>
          </DialogHeader>
          <p className="text-[30px] font-bold text-ink-2 tabular-nums -mt-1">
            {lastTransaction && formatCurrency(lastTransaction.grandTotal)}
          </p>

          <div className="space-y-2.5 mt-2">
            {lastTransaction?.wantsInvoice && (
              <button
                onClick={downloadInvoicePdf}
                className="w-full h-11 rounded-full bg-chip text-ink-2 text-[14px] font-semibold inline-flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Descargar factura
              </button>
            )}
            <input
              type="email"
              placeholder="Email para el ticket"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full h-11 rounded-2xl bg-chip px-3.5 text-[14px] text-center outline-none text-ink-2"
            />
            {getEmailToUse() && (
              <button
                onClick={sendTicketEmail}
                disabled={sendingEmail}
                className="w-full h-11 rounded-full bg-chip text-ink-2 text-[14px] font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {sendingEmail ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                Enviar ticket
              </button>
            )}

            {/* Si no hay email, el enlace de valoración se puede pasar a mano */}
            {lastTransaction?.reviewUrl && (
              <div className="rounded-2xl bg-surface-container-low p-3 space-y-2">
                <p className="text-[12px] font-semibold text-ink-2">Pídele que te valore</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(lastTransaction.reviewUrl);
                      toast({ title: "Enlace copiado" });
                    }}
                    className="flex-1 h-10 rounded-full bg-chip text-ink-2 text-[13px] font-semibold inline-flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copiar enlace
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `¡Gracias por tu visita! ¿Nos dejas tu valoración? ${lastTransaction.reviewUrl}`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 h-10 rounded-full bg-chip text-ink-2 text-[13px] font-semibold inline-flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>
                </div>
              </div>
            )}
            <button
              onClick={() => setShowSuccess(false)}
              className="w-full h-12 rounded-full bg-gradient-brand text-white text-[15px] font-semibold"
            >
              Nuevo cobro
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
