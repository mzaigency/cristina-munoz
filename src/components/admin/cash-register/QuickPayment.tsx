import { useState, useEffect } from "react";
import { STYLIST_FALLBACK } from "@/lib/chartColors";
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
  Wallet,
  Pencil,
  Coins,
  RotateCcw,
  Check,
  AlertCircle,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { fetchBookingChargeGroup } from "@/lib/bookingGroup";

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

  // Price editing state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemPrice, setEditingItemPrice] = useState("");
  const [editingTotal, setEditingTotal] = useState(false);
  const [customTotalInput, setCustomTotalInput] = useState("");

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
  // Todas las filas de la visita (las dos partes de un compuesto incluidas)
  const [selectedBookingGroupIds, setSelectedBookingGroupIds] = useState<string[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const { toast } = useToast();

  // Si se vacía el carrito desde la hoja, no tiene sentido dejarla abierta
  useEffect(() => {
    if (payOpen && selectedItems.length === 0) setPayOpen(false);
  }, [payOpen, selectedItems.length]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && payOpen && !loading) {
        setPayOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [payOpen, loading]);

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
          void loadBookingData(booking, services, stylists);
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

  const loadBookingData = async (booking: any, servicesList?: Service[], stylistsList?: Stylist[]) => {
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
    
    // Cobrar una parte cobra la visita entera: juntamos los servicios de todas
    // las filas vinculadas (las dos partes de un compuesto cuentan una vez).
    let visitServices: any[] = Array.isArray(booking.services) ? booking.services : [];
    let groupIds: string[] = [booking.id];
    try {
      const group = await fetchBookingChargeGroup(booking.id);
      groupIds = group.ids;
      if (group.services.length > 0) visitServices = group.services;
    } catch (e) {
      console.error("booking charge group", e);
    }
    setSelectedBookingGroupIds(groupIds);

    // Load services from booking with prices
    if (visitServices.length > 0) {
      const bookingServices: SelectedItem[] = visitServices.map((s: any, idx: number) => {
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

  const cashToPay =
    paymentMethod === "cash"
      ? grandTotal
      : paymentMethod === "mixed"
      ? numericCashAmount
      : 0;

  const changeAmount =
    numericCashGiven >= cashToPay && cashToPay > 0
      ? numericCashGiven - cashToPay
      : 0;

  const handleExactCash = () => {
    setCashGiven(cashToPay.toFixed(2));
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

  const updateItemPrice = (itemId: string, newPrice: number) => {
    setSelectedItems((prev) =>
      prev.map((s) => (s.id === itemId ? { ...s, price: Math.max(0, newPrice) } : s))
    );
  };

  const startEditItemPrice = (item: SelectedItem) => {
    setEditingItemId(item.id);
    setEditingItemPrice(item.price.toString());
  };

  const saveItemPrice = (itemId: string) => {
    const parsed = parseFloat(editingItemPrice);
    if (!isNaN(parsed) && parsed >= 0) {
      updateItemPrice(itemId, parsed);
    }
    setEditingItemId(null);
    setEditingItemPrice("");
  };

  const handleSelectPaymentMethod = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method === "mixed") {
      const half = (grandTotal / 2).toFixed(2);
      const remainder = (grandTotal - parseFloat(half)).toFixed(2);
      setCashAmount(half);
      setCardAmount(remainder);
    }
  };

  const handleCashAmountChange = (val: string) => {
    setCashAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= grandTotal) {
      setCardAmount((grandTotal - num).toFixed(2));
    }
  };

  const handleCardAmountChange = (val: string) => {
    setCardAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= grandTotal) {
      setCashAmount((grandTotal - num).toFixed(2));
    }
  };

  const handleSplitFiftyFifty = () => {
    const half = (grandTotal / 2).toFixed(2);
    const remainder = (grandTotal - parseFloat(half)).toFixed(2);
    setCashAmount(half);
    setCardAmount(remainder);
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
    setSelectedBookingGroupIds([]);
    setEditingItemId(null);
    setEditingItemPrice("");
    setEditingTotal(false);
    setCustomTotalInput("");
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
          .in("id", selectedBookingGroupIds.length > 0 ? selectedBookingGroupIds : [selectedBookingId]);
        
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

      const txSnapshot = {
        ...transactionData,
        stylistName: selectedStylist?.name || "Estilista",
        items: servicesData,
        grandTotal,
        customerEmail: resolvedEmail,
        wantsInvoice,
        invoiceData,
        reviewUrl,
        autoSent: false as boolean,
      };

      // Si ya tenemos su email, el ticket se envía solo: la peluquera no hace nada
      if (resolvedEmail) {
        txSnapshot.autoSent = true;
        void postTicket(txSnapshot, resolvedEmail)
          .then(() => toast({ title: "Ticket enviado por email ✉️" }))
          .catch((e) => {
            console.error("auto ticket", e);
            toast({ title: "No se pudo enviar el ticket automáticamente", variant: "destructive" });
          });
      }

      setLastTransaction(txSnapshot);

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

  async function postTicket(tx: any, email: string) {
    const { error } = await supabase.functions.invoke("send-ticket", {
      body: {
        type: "ticket",
        customerEmail: email,
        customerName: tx.customer_name,
        tenantId,
        items: tx.items,
        subtotal: tx.subtotal,
        discount: tx.discount,
        discountReason: tx.discount_reason,
        tip: tx.tip_amount,
        total: tx.grandTotal,
        paymentMethod: tx.payment_method,
        stylistName: tx.stylistName,
        reviewUrl: tx.reviewUrl || undefined,
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
  }

  const sendTicketEmail = async () => {
    const email = getEmailToUse();
    if (!lastTransaction || !email) {
      toast({ title: "Introduce un email", variant: "destructive" });
      return;
    }

    try {
      setSendingEmail(true);
      await postTicket(lastTransaction, email);
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
        <td style="padding: 12px; border-bottom: 1px solid #E4E6EF;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #E4E6EF; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #E4E6EF; text-align: right;">${formatCurrency(item.price)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #E4E6EF; text-align: right;">${formatCurrency(item.total)}</td>
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
          .party { flex: 1; padding: 20px; background: #F6F7FB; border-radius: 8px; }
          .party-title { font-size: 12px; text-transform: uppercase; color: #888; margin-bottom: 8px; font-weight: 600; }
          .party-name { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
          .party-details { font-size: 14px; color: #666; line-height: 1.5; }
          table { width: 100%; border-collapse: collapse; margin: 30px 0; }
          thead { background: #333; color: white; }
          th { padding: 14px 12px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; }
          th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: right; }
          th:nth-child(2) { text-align: center; }
          tbody tr:hover { background: #F6F7FB; }
          .totals { margin-top: 20px; display: flex; justify-content: flex-end; }
          .totals-box { width: 280px; }
          .totals-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .totals-row.discount { color: #98329A; }
          .totals-row.tip { color: #16A249; }
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
    <div>
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
                  onClick={() => void loadBookingData(booking, services, stylists)}
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
          queda pegada abajo (sticky) en escritorio. */}
      {selectedItems.length > 0 && (
        <>
          <div className="h-24 min-[920px]:h-4" />
          <div
            className="fixed left-0 right-0 z-30 px-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] min-[920px]:sticky min-[920px]:left-auto min-[920px]:right-auto min-[920px]:bottom-4 min-[920px]:px-0 min-[920px]:mt-2"
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

      {/* ── MODAL / HOJA DE COBRO ADAPTADA DESKTOP & MOBILE ─────── */}
      {payOpen && (
        <div
          className="ag-detail-wrap"
          onClick={() => !loading && setPayOpen(false)}
        >
          <div
            className="ag-detail-sheet flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 560, maxHeight: "90vh" }}
          >
            <div className="ag-detail-grip" aria-hidden />

            <button
              className="ag-detail-close"
              onClick={() => !loading && setPayOpen(false)}
              aria-label="Cerrar cobro"
              disabled={loading}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 mb-3 pr-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                <Wallet className="w-3.5 h-3.5 text-indigo-600" />
                Cobro en caja
              </span>
              {customerName ? (
                <span className="text-xs text-slate-500 font-semibold truncate">
                  {customerName}
                </span>
              ) : (
                <span className="text-xs text-slate-400 font-medium">
                  Ticket de venta
                </span>
              )}
            </div>

            {/* ── TOTAL A COBRAR (PROMINENTE Y MODIFICABLE) ── */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-200/80 mb-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Total a cobrar
                </span>

                {/* BOTÓN PROMINENTE DE MODIFICAR PRECIO */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    if (selectedItems.length === 1) {
                      startEditItemPrice(selectedItems[0]);
                    } else {
                      setEditingTotal(!editingTotal);
                      setCustomTotalInput(grandTotal.toFixed(2));
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 shadow-sm transition transform active:scale-95 cursor-pointer"
                  title="Modificar precio fácilmente"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Modificar precio
                </button>
              </div>

              {/* Total Display */}
              {!editingTotal ? (
                <div className="flex items-baseline justify-between">
                  <div
                    className="flex items-baseline gap-1.5 cursor-pointer group"
                    onClick={() => {
                      if (!loading) {
                        if (selectedItems.length === 1) {
                          startEditItemPrice(selectedItems[0]);
                        } else {
                          setEditingTotal(true);
                          setCustomTotalInput(grandTotal.toFixed(2));
                        }
                      }
                    }}
                    title="Haz clic para modificar importe"
                  >
                    <span className="text-4xl font-black text-slate-900 tracking-tight tabular-nums group-hover:text-indigo-600 transition">
                      {grandTotal.toFixed(2)}
                    </span>
                    <span className="text-2xl font-bold text-slate-400">€</span>
                  </div>

                  {(discountAmount > 0 || tip > 0) && (
                    <div className="flex flex-col items-end text-xs">
                      {discountAmount > 0 && (
                        <span className="text-amber-600 font-semibold tabular-nums">
                          Dto: -{formatCurrency(discountAmount)}
                        </span>
                      )}
                      {tip > 0 && (
                        <span className="text-emerald-600 font-semibold tabular-nums">
                          Propina: +{formatCurrency(tip)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-indigo-100">
                  <span className="text-xs font-bold text-slate-600">Nuevo total:</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    value={customTotalInput}
                    onChange={(e) => setCustomTotalInput(e.target.value)}
                    className="w-28 px-3 py-1 rounded-lg border border-indigo-300 bg-white text-lg font-black text-slate-900 outline-none"
                    placeholder="0.00"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const parsed = parseFloat(customTotalInput);
                      if (!isNaN(parsed) && parsed >= 0) {
                        if (selectedItems.length === 1) {
                          updateItemPrice(selectedItems[0].id, parsed);
                        } else {
                          if (parsed < subtotal) {
                            setDiscountType("fixed");
                            setDiscountValue((subtotal - parsed).toFixed(2));
                          } else {
                            setDiscountType(null);
                            setDiscountValue("");
                            setTipAmount((parsed - subtotal).toFixed(2));
                          }
                        }
                      }
                      setEditingTotal(false);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTotal(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 px-1"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-left">
              {/* Líneas / Detalle */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Detalle ({itemCount})
                  </label>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-[11px] font-semibold text-rose-500 hover:text-rose-700 transition cursor-pointer"
                  >
                    Vaciar ticket
                  </button>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
                  {selectedItems.map((item) => {
                    const isEditingPrice = editingItemId === item.id;
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="block text-sm font-semibold text-slate-800 truncate">
                            {item.name}
                          </span>
                          {isEditingPrice ? (
                            <div className="flex items-center gap-1.5 mt-1">
                              <input
                                type="number"
                                inputMode="decimal"
                                step="0.5"
                                autoFocus
                                value={editingItemPrice}
                                onChange={(e) => setEditingItemPrice(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveItemPrice(item.id);
                                  if (e.key === "Escape") setEditingItemId(null);
                                }}
                                className="w-20 px-2 py-0.5 text-xs font-bold rounded-md border border-indigo-300 bg-white text-indigo-700 outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => saveItemPrice(item.id)}
                                className="px-2 py-0.5 text-xs font-bold rounded-md bg-indigo-600 text-white"
                              >
                                OK
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingItemId(null)}
                                className="p-0.5 text-slate-400 hover:text-slate-600"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs text-slate-400 tabular-nums">
                                {formatCurrency(item.price)}
                              </span>
                              <button
                                type="button"
                                onClick={() => startEditItemPrice(item)}
                                className="inline-flex items-center gap-0.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/80 hover:bg-indigo-100 px-1.5 py-0.5 rounded transition cursor-pointer"
                                title="Modificar precio de este concepto"
                              >
                                <Pencil className="w-2.5 h-2.5" />
                                Modificar
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Qty controls */}
                        <div className="flex items-center gap-1 flex-none bg-slate-100 rounded-lg p-0.5">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            aria-label="Quitar uno"
                            className="w-6 h-6 rounded-md bg-white text-slate-700 flex items-center justify-center hover:bg-slate-50 active:scale-95 shadow-xs transition cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold tabular-nums text-slate-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            aria-label="Añadir uno"
                            className="w-6 h-6 rounded-md bg-white text-slate-700 flex items-center justify-center hover:bg-slate-50 active:scale-95 shadow-xs transition cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Subtotal */}
                        <span className="w-16 text-right text-sm font-bold text-slate-900 tabular-nums flex-none">
                          {formatCurrency(item.price * item.quantity)}
                        </span>

                        {/* Remove */}
                        <button
                          onClick={() => removeItem(item.id)}
                          aria-label={`Quitar ${item.name}`}
                          className="flex-none p-1 text-slate-300 hover:text-rose-500 transition cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Descuento y propina */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDiscount(!showDiscount)}
                    className={`flex-1 h-9 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      showDiscount || discountAmount > 0
                        ? "bg-amber-500 text-white shadow-xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" />
                    {discountAmount > 0 ? `Descuento (-${formatCurrency(discountAmount)})` : "Descuento"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTip(!showTip)}
                    className={`flex-1 h-9 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      showTip || tip > 0
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5" />
                    {tip > 0 ? `Propina (+${formatCurrency(tip)})` : "Propina"}
                  </button>
                </div>

                {showDiscount && (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50/50 border border-amber-200">
                    <div className="flex rounded-lg overflow-hidden border border-amber-300 bg-white p-0.5">
                      <button
                        type="button"
                        onClick={() => setDiscountType("percentage")}
                        className={`px-2.5 py-1 text-xs font-bold rounded cursor-pointer ${
                          discountType === "percentage" ? "bg-amber-500 text-white" : "text-amber-800 hover:bg-amber-50"
                        }`}
                      >
                        %
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountType("fixed")}
                        className={`px-2.5 py-1 text-xs font-bold rounded cursor-pointer ${
                          discountType === "fixed" ? "bg-amber-500 text-white" : "text-amber-800 hover:bg-amber-50"
                        }`}
                      >
                        €
                      </button>
                    </div>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={discountValue}
                      onChange={(e) => {
                        if (!discountType) setDiscountType("percentage");
                        setDiscountValue(e.target.value);
                      }}
                      placeholder="Valor"
                      className="flex-1 min-w-0 h-8 rounded-lg bg-white border border-amber-200 px-2.5 text-sm font-semibold text-center tabular-nums outline-none text-slate-800 focus:border-amber-500"
                    />
                    {discountAmount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setDiscountValue("");
                          setDiscountType(null);
                        }}
                        className="text-xs font-bold text-amber-700 hover:underline px-1 cursor-pointer"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                )}

                {showTip && (
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-50/50 border border-emerald-200">
                    {[1, 2, 5, 10].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setTipAmount(parseFloat(tipAmount) === v ? "" : v.toString())}
                        className={`flex-1 h-8 rounded-lg text-xs font-bold tabular-nums transition cursor-pointer ${
                          parseFloat(tipAmount) === v
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                        }`}
                      >
                        +{v}€
                      </button>
                    ))}
                    {tip > 0 && (
                      <button
                        type="button"
                        onClick={() => setTipAmount("")}
                        className="text-xs font-bold text-emerald-700 hover:underline px-1 cursor-pointer"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Cómo paga */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Método de pago
                </label>
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
                        type="button"
                        onClick={() => handleSelectPaymentMethod(value)}
                        className={`py-2.5 px-3 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                          on
                            ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                            : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${on ? "text-indigo-400" : "text-slate-500"}`} />
                        <span className="text-xs font-bold">{label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Tarjeta view */}
                {paymentMethod === "card" && (
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-none">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800">Cobro íntegro con tarjeta</p>
                      <p className="text-[11px] text-slate-500">Pasa el datáfono / TPV por {formatCurrency(grandTotal)}</p>
                    </div>
                  </div>
                )}

                {/* Mixto view */}
                {paymentMethod === "mixed" && (
                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Desglose del cobro</span>
                      <button
                        type="button"
                        onClick={handleSplitFiftyFifty}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-200 px-2 py-0.5 rounded-md shadow-xs transition cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        50% / 50%
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                        <span className="block text-[11px] font-bold text-slate-500 mb-1">
                          Efectivo
                        </span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            inputMode="decimal"
                            value={cashAmount}
                            onChange={(e) => handleCashAmountChange(e.target.value)}
                            placeholder="0.00"
                            className="w-full text-base font-bold tabular-nums outline-none text-slate-900"
                          />
                          <span className="text-xs font-bold text-slate-400">€</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                        <span className="block text-[11px] font-bold text-slate-500 mb-1">
                          Tarjeta
                        </span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            inputMode="decimal"
                            value={cardAmount}
                            onChange={(e) => handleCardAmountChange(e.target.value)}
                            placeholder="0.00"
                            className="w-full text-base font-bold tabular-nums outline-none text-slate-900"
                          />
                          <span className="text-xs font-bold text-slate-400">€</span>
                        </div>
                      </div>
                    </div>

                    {/* Balance status */}
                    {getMixedRemaining() > 0.01 ? (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2">
                        <AlertCircle className="w-3.5 h-3.5 flex-none" />
                        <span>Faltan {formatCurrency(getMixedRemaining())} por asignar</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2">
                        <Check className="w-3.5 h-3.5 flex-none" />
                        <span>Importe total completamente asignado ({formatCurrency(grandTotal)})</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Entrega y Cambio para Efectivo o Mixto */}
                {(paymentMethod === "cash" || (paymentMethod === "mixed" && numericCashAmount > 0)) && (
                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">
                        {paymentMethod === "mixed" ? "Entrega de efectivo" : "Entrega del cliente"}
                      </span>
                      <button
                        type="button"
                        onClick={handleExactCash}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-200 px-2 py-0.5 rounded-md shadow-xs transition cursor-pointer"
                      >
                        Exacto ({formatCurrency(cashToPay)})
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        inputMode="decimal"
                        value={cashGiven}
                        onChange={(e) => setCashGiven(e.target.value)}
                        placeholder={`Ej: ${Math.ceil(cashToPay)}`}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-lg font-black text-slate-900 tabular-nums focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                        €
                      </span>
                    </div>

                    {changeAmount > 0 && (
                      <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5">
                        <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                          <Coins className="w-4 h-4 text-emerald-600" />
                          Cambio a devolver
                        </span>
                        <span className="text-xl font-black text-emerald-700 tabular-nums">
                          +{formatCurrency(changeAmount)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Atendido por */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Atendido por <span className="text-rose-500">*</span>
                  </label>
                  {!selectedStylistId && (
                    <span className="text-[11px] font-semibold text-rose-500">Requerido</span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {stylists.map((stylist) => {
                    const on = selectedStylistId === stylist.id;
                    return (
                      <button
                        key={stylist.id}
                        type="button"
                        onClick={() => setSelectedStylistId(stylist.id)}
                        className={`h-10 px-3 rounded-xl inline-flex items-center gap-2 text-xs font-bold transition border cursor-pointer ${
                          on
                            ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                            : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-none"
                          style={{ background: stylist.color || STYLIST_FALLBACK }}
                        />
                        <span className="truncate">{stylist.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cliente */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Cliente (opcional)
                </label>
                <div className="rounded-xl bg-white border border-slate-200 overflow-hidden divide-y divide-slate-100">
                  <div className="flex items-center gap-2.5 px-3 py-2">
                    <User className="w-3.5 h-3.5 text-slate-400 flex-none" />
                    <input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nombre del cliente"
                      className="flex-1 min-w-0 bg-transparent text-xs font-medium outline-none text-slate-800 placeholder:text-slate-400"
                    />
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 flex-none" />
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="Email para enviar ticket digital"
                      className="flex-1 min-w-0 bg-transparent text-xs font-medium outline-none text-slate-800 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer / Confirmación */}
            <div className="shrink-0 pt-3 border-t border-slate-200 mt-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  loading ||
                  selectedItems.length === 0 ||
                  !selectedStylistId ||
                  (paymentMethod === "mixed" && getMixedRemaining() > 0.01)
                }
                className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-md transition active:scale-[.99] cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Confirmar cobro · {formatCurrency(grandTotal)}
                  </>
                )}
              </button>
              {!selectedStylistId && (
                <p className="text-center text-[11px] text-rose-500 font-medium mt-1.5">
                  Selecciona quién ha atendido para poder cobrar
                </p>
              )}
            </div>
          </div>
        </div>
      )}

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
