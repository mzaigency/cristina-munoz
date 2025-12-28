import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Banknote, 
  CreditCard, 
  CheckCircle2,
  Calculator,
  Percent,
  Euro,
  Heart,
  Scissors,
  User,
  X,
  Plus,
  Minus,
  Package
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Service {
  id: string;
  name: string;
  price: number | null;
  category: string | null;
  duration_part1_active: number;
}

interface Stylist {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

interface SelectedService extends Service {
  quantity: number;
  type: "service" | "product";
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
}

type PaymentMethod = "cash" | "card" | "mixed";
type DiscountType = "percentage" | "fixed" | null;

export const QuickPayment = ({ onTransactionCreated }: QuickPaymentProps) => {
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [selectedStylistId, setSelectedStylistId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashAmount, setCashAmount] = useState("");
  const [cardAmount, setCardAmount] = useState("");
  const [cashGiven, setCashGiven] = useState("");
  
  const [discountType, setDiscountType] = useState<DiscountType>(null);
  const [discountValue, setDiscountValue] = useState("");
  const [discountReason, setDiscountReason] = useState("");
  
  const [tipAmount, setTipAmount] = useState("");
  
  const { toast } = useToast();

  useEffect(() => {
    fetchServicesAndStylists();
  }, []);

  const fetchServicesAndStylists = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: tenantAdmin } = await supabase
        .from("tenant_admins")
        .select("tenant_id")
        .eq("user_id", user.id)
        .maybeSingle();

      let tenantId = tenantAdmin?.tenant_id;
      
      if (!tenantId) {
        const { data: stylistData } = await supabase
          .from("tenant_stylists")
          .select("tenant_id")
          .eq("user_id", user.id)
          .maybeSingle();
        tenantId = stylistData?.tenant_id;
      }
      
      if (tenantId) {
        const [servicesRes, stylistsRes, productsRes] = await Promise.all([
          supabase.from("services").select("id, name, price, category, duration_part1_active")
            .eq("tenant_id", tenantId).order("category").order("name"),
          supabase.from("tenant_stylists").select("id, name, slug, color")
            .eq("tenant_id", tenantId).eq("is_active", true).order("name"),
          supabase.from("products").select("id, name, price, category, stock")
            .eq("tenant_id", tenantId).eq("is_active", true).order("name")
        ]);
        if (servicesRes.data) setServices(servicesRes.data);
        if (stylistsRes.data) setStylists(stylistsRes.data);
        if (productsRes.data) setProducts(productsRes.data as Product[]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const subtotal = selectedServices.reduce((sum, s) => sum + (s.price || 0) * s.quantity, 0);

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

  const getMixedTotal = () => numericCashAmount + numericCardAmount;
  const getMixedRemaining = () => Math.max(grandTotal - getMixedTotal(), 0);
  const getChange = () => {
    if (paymentMethod === "mixed") return Math.max(numericCashGiven - numericCashAmount, 0);
    return Math.max(numericCashGiven - grandTotal, 0);
  };

  const toggleService = (service: Service) => {
    const existing = selectedServices.find(s => s.id === service.id);
    if (existing) {
      setSelectedServices(selectedServices.filter(s => s.id !== service.id));
    } else {
      setSelectedServices([...selectedServices, { ...service, quantity: 1, type: "service" as const }]);
    }
  };

  const updateQuantity = (serviceId: string, delta: number) => {
    setSelectedServices(selectedServices.map(s => 
      s.id === serviceId ? { ...s, quantity: Math.max(1, s.quantity + delta) } : s
    ));
  };

  const removeService = (serviceId: string) => {
    setSelectedServices(selectedServices.filter(s => s.id !== serviceId));
  };

  const groupedServices = services.reduce((acc, service) => {
    const category = service.category || "Otros";
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const clearAll = () => {
    setSelectedServices([]);
    setSelectedStylistId("");
    setCustomerName("");
    setNotes("");
    setPaymentMethod("cash");
    setCashAmount("");
    setCardAmount("");
    setCashGiven("");
    setDiscountType(null);
    setDiscountValue("");
    setDiscountReason("");
    setTipAmount("");
  };

  const handleSubmit = async () => {
    if (selectedServices.length === 0) {
      toast({ title: "Error", description: "Selecciona al menos un servicio", variant: "destructive" });
      return;
    }
    if (!selectedStylistId) {
      toast({ title: "Error", description: "Selecciona un estilista", variant: "destructive" });
      return;
    }
    if (paymentMethod === "mixed" && getMixedRemaining() > 0.01) {
      toast({ title: "Error", description: `Faltan ${formatCurrency(getMixedRemaining())} por asignar`, variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const selectedStylist = stylists.find(s => s.id === selectedStylistId);
      const servicesData = selectedServices.map(s => ({
        id: s.id, name: s.name, price: s.price || 0, quantity: s.quantity, total: (s.price || 0) * s.quantity
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
        notes: notes.trim() || null,
        created_by: user.id,
      };

      const { error } = await supabase.from("transactions").insert(transactionData as never);

      if (error) throw error;
      clearAll();
      onTransactionCreated();
    } catch (error: unknown) {
      console.error("Error:", error);
      toast({ title: "Error", description: error instanceof Error ? error.message : "No se pudo registrar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(value);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column - Service Selection */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4" />Estilista
          </Label>
          <Select value={selectedStylistId} onValueChange={setSelectedStylistId}>
            <SelectTrigger><SelectValue placeholder="Selecciona estilista" /></SelectTrigger>
            <SelectContent>
              {stylists.map((stylist) => (
                <SelectItem key={stylist.id} value={stylist.id}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stylist.color || "#8B5CF6" }} />
                    {stylist.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Cliente (opcional)</Label>
          <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nombre del cliente" />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2"><Scissors className="h-4 w-4" />Servicios</Label>
          <Accordion type="multiple" className="w-full">
            {Object.entries(groupedServices).map(([category, categoryServices]) => (
              <AccordionItem key={category} value={category}>
                <AccordionTrigger className="text-sm">
                  {category}<Badge variant="secondary" className="ml-2">{categoryServices.length}</Badge>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1">
                    {categoryServices.map((service) => {
                      const isSelected = selectedServices.some(s => s.id === service.id);
                      return (
                        <div key={service.id}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50"}`}
                          onClick={() => toggleService(service)}>
                          <div className="flex items-center gap-2">
                            <Checkbox checked={isSelected} />
                            <span className="text-sm">{service.name}</span>
                          </div>
                          <span className="text-sm font-medium">{service.price ? formatCurrency(service.price) : "—"}</span>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {selectedServices.length > 0 && (
          <Card className="border-primary/20">
            <CardContent className="p-3 space-y-2">
              <Label className="text-xs text-muted-foreground">Servicios seleccionados</Label>
              {selectedServices.map((service) => (
                <div key={service.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex-1 truncate">{service.name}</span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); updateQuantity(service.id, -1); }}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center">{service.quantity}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); updateQuantity(service.id, 1); }}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="font-medium w-20 text-right">{formatCurrency((service.price || 0) * service.quantity)}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); removeService(service.id); }}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Column - Payment */}
      <div className="space-y-4">
        <Card className="border-orange-200/50 bg-orange-50/30 dark:bg-orange-950/10">
          <CardContent className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Percent className="h-4 w-4 text-orange-600" />Descuento
              </Label>
              {discountType && (
                <Button variant="ghost" size="sm" onClick={() => { setDiscountType(null); setDiscountValue(""); setDiscountReason(""); }}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant={discountType === "percentage" ? "default" : "outline"} size="sm" onClick={() => setDiscountType("percentage")} className="gap-1">
                <Percent className="h-3 w-3" />Porcentaje
              </Button>
              <Button variant={discountType === "fixed" ? "default" : "outline"} size="sm" onClick={() => setDiscountType("fixed")} className="gap-1">
                <Euro className="h-3 w-3" />Importe fijo
              </Button>
            </div>
            {discountType && (
              <div className="space-y-2">
                <Input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} 
                  placeholder={discountType === "percentage" ? "Ej: 10" : "Ej: 5.00"} className="text-center" />
                <Input value={discountReason} onChange={(e) => setDiscountReason(e.target.value)} 
                  placeholder="Motivo del descuento (opcional)" className="text-sm" />
                {discountAmount > 0 && <p className="text-sm text-orange-600 text-center">Descuento: -{formatCurrency(discountAmount)}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-pink-200/50 bg-pink-50/30 dark:bg-pink-950/10">
          <CardContent className="p-3 space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Heart className="h-4 w-4 text-pink-600" />Propina (opcional)
            </Label>
            <div className="flex gap-2">
              <Input type="number" value={tipAmount} onChange={(e) => setTipAmount(e.target.value)} placeholder="0.00" className="text-center" />
              <div className="flex gap-1">
                {[1, 2, 5].map((v) => (
                  <Button key={v} variant="outline" size="sm" onClick={() => setTipAmount(v.toString())}>{v}€</Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Método de pago</Label>
          <div className="grid grid-cols-3 gap-2">
            <Button variant={paymentMethod === "cash" ? "default" : "outline"} className="h-10 gap-1" onClick={() => setPaymentMethod("cash")}>
              <Banknote className="h-4 w-4" />Efectivo
            </Button>
            <Button variant={paymentMethod === "card" ? "default" : "outline"} className="h-10 gap-1" onClick={() => setPaymentMethod("card")}>
              <CreditCard className="h-4 w-4" />Tarjeta
            </Button>
            <Button variant={paymentMethod === "mixed" ? "default" : "outline"} className="h-10 gap-1 text-xs" onClick={() => setPaymentMethod("mixed")}>
              <Banknote className="h-3 w-3" />+<CreditCard className="h-3 w-3" />Mixto
            </Button>
          </div>
        </div>

        {paymentMethod === "mixed" && (
          <Card className="border-blue-200/50 bg-blue-50/30 dark:bg-blue-950/10">
            <CardContent className="p-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1"><Banknote className="h-3 w-3" />Efectivo</Label>
                  <Input type="number" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} placeholder="0.00" className="text-center" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1"><CreditCard className="h-3 w-3" />Tarjeta</Label>
                  <Input type="number" value={cardAmount} onChange={(e) => setCardAmount(e.target.value)} placeholder="0.00" className="text-center" />
                </div>
              </div>
              {getMixedRemaining() > 0.01 && <p className="text-sm text-destructive text-center">Falta asignar: {formatCurrency(getMixedRemaining())}</p>}
              {getMixedRemaining() <= 0.01 && getMixedTotal() > 0 && <p className="text-sm text-green-600 text-center">✓ Total cubierto</p>}
            </CardContent>
          </Card>
        )}

        {(paymentMethod === "cash" || (paymentMethod === "mixed" && numericCashAmount > 0)) && (
          <Card className="border-emerald-200/50 bg-emerald-50/50 dark:bg-emerald-950/20">
            <CardContent className="p-3 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <Calculator className="h-4 w-4" /><Label className="text-sm font-medium">Calcular cambio</Label>
              </div>
              <Input type="number" value={cashGiven} onChange={(e) => setCashGiven(e.target.value)} placeholder="Efectivo entregado" className="text-center font-semibold" />
              <div className="grid grid-cols-4 gap-1">
                {[5, 10, 20, 50].map((v) => (
                  <Button key={v} variant="outline" size="sm" onClick={() => setCashGiven(v.toString())} className="text-xs h-8">{v}€</Button>
                ))}
              </div>
              {getChange() > 0 && (
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg text-center">
                  <span className="text-xs text-muted-foreground">Cambio</span>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(getChange())}</div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Notas (opcional)</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value.slice(0, 200))} placeholder="Añadir comentario..." className="resize-none h-12 text-sm" maxLength={200} />
        </div>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            {discountAmount > 0 && <div className="flex justify-between text-sm text-orange-600"><span>Descuento</span><span>-{formatCurrency(discountAmount)}</span></div>}
            {tip > 0 && <div className="flex justify-between text-sm text-pink-600"><span>Propina</span><span>+{formatCurrency(tip)}</span></div>}
            <div className="border-t pt-2 flex justify-between text-lg font-bold">
              <span>Total</span><span className="text-primary">{formatCurrency(grandTotal)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button variant="outline" onClick={clearAll} className="flex-shrink-0">Limpiar</Button>
          <Button onClick={handleSubmit} disabled={loading || selectedServices.length === 0 || !selectedStylistId} className="flex-1 h-12 text-lg" size="lg">
            {loading ? (<><Loader2 className="h-5 w-5 mr-2 animate-spin" />Registrando...</>) 
              : (<><CheckCircle2 className="h-5 w-5 mr-2" />Cobrar {grandTotal > 0 ? formatCurrency(grandTotal) : ""}</>)}
          </Button>
        </div>
      </div>
    </div>
  );
};
