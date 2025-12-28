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
  Sparkles
} from "lucide-react";
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
  
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [tenantId]);

  const fetchData = async () => {
    try {
      const [servicesRes, stylistsRes, productsRes] = await Promise.all([
        supabase.from("services").select("id, name, price, category")
          .eq("tenant_id", tenantId).order("category").order("name"),
        supabase.from("tenant_stylists").select("id, name, slug, color")
          .eq("tenant_id", tenantId).eq("is_active", true).order("name"),
        supabase.from("products").select("id, name, price, category, stock")
          .eq("tenant_id", tenantId).eq("is_active", true).order("name")
      ]);
      if (servicesRes.data) setServices(servicesRes.data);
      if (stylistsRes.data) setStylists(stylistsRes.data);
      if (productsRes.data) setProducts(productsRes.data as Product[]);
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
        customerEmail
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

  const sendTicketEmail = async () => {
    if (!lastTransaction || !lastTransaction.customerEmail) {
      toast({ title: "Introduce un email", variant: "destructive" });
      return;
    }

    try {
      setSendingEmail(true);
      const { data, error } = await supabase.functions.invoke("send-ticket", {
        body: {
          customerEmail: lastTransaction.customerEmail,
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
        <div className="p-4 border-b">
          <Input 
            value={customerName} 
            onChange={(e) => setCustomerName(e.target.value)} 
            placeholder="Nombre cliente"
            className="bg-muted/50 border-0 text-center font-medium"
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

          {/* Email for ticket */}
          <Input 
            type="email"
            value={customerEmail} 
            onChange={(e) => setCustomerEmail(e.target.value)} 
            placeholder="Email para ticket (opcional)"
            className="text-center text-sm"
          />

          <Button 
            onClick={handleSubmit} 
            disabled={loading || selectedItems.length === 0 || !selectedStylistId} 
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
        <DialogContent className="max-w-sm text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mx-auto w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4"
          >
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </motion.div>
          <DialogHeader>
            <DialogTitle className="text-2xl">¡Cobro realizado!</DialogTitle>
          </DialogHeader>
          <p className="text-3xl font-bold text-primary">
            {lastTransaction && formatCurrency(lastTransaction.grandTotal)}
          </p>
          
          {lastTransaction?.customerEmail && (
            <div className="mt-4">
              <Button 
                onClick={sendTicketEmail} 
                disabled={sendingEmail}
                className="w-full gap-2"
                variant="outline"
              >
                {sendingEmail ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                Enviar ticket por email
              </Button>
            </div>
          )}
          
          <Button onClick={() => setShowSuccess(false)} className="w-full mt-2">
            Nuevo cobro
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};
