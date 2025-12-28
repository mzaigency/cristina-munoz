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
  Percent,
  Euro,
  Heart,
  Scissors,
  User,
  X,
  Plus,
  Minus,
  Package,
  PenLine
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

interface SelectedItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: "service" | "product" | "manual";
  category?: string | null;
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
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [selectedStylistId, setSelectedStylistId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  
  // Manual item
  const [manualItemName, setManualItemName] = useState("");
  const [manualItemPrice, setManualItemPrice] = useState("");
  
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

  const getMixedTotal = () => numericCashAmount + numericCardAmount;
  const getMixedRemaining = () => Math.max(grandTotal - getMixedTotal(), 0);
  const getChange = () => {
    if (paymentMethod === "mixed") return Math.max(numericCashGiven - numericCashAmount, 0);
    return Math.max(numericCashGiven - grandTotal, 0);
  };

  const toggleService = (service: Service) => {
    const existing = selectedItems.find(s => s.id === service.id && s.type === "service");
    if (existing) {
      setSelectedItems(selectedItems.filter(s => !(s.id === service.id && s.type === "service")));
    } else {
      setSelectedItems([...selectedItems, { 
        id: service.id, 
        name: service.name, 
        price: service.price || 0, 
        quantity: 1, 
        type: "service",
        category: service.category
      }]);
    }
  };

  const toggleProduct = (product: Product) => {
    const existing = selectedItems.find(s => s.id === product.id && s.type === "product");
    if (existing) {
      setSelectedItems(selectedItems.filter(s => !(s.id === product.id && s.type === "product")));
    } else {
      setSelectedItems([...selectedItems, { 
        id: product.id, 
        name: product.name, 
        price: product.price, 
        quantity: 1, 
        type: "product",
        category: product.category
      }]);
    }
  };

  const addManualItem = () => {
    if (!manualItemName.trim() || !manualItemPrice) {
      toast({ title: "Error", description: "Introduce nombre y precio", variant: "destructive" });
      return;
    }
    const price = parseFloat(manualItemPrice) || 0;
    if (price <= 0) {
      toast({ title: "Error", description: "El precio debe ser mayor que 0", variant: "destructive" });
      return;
    }
    setSelectedItems([...selectedItems, { 
      id: `manual-${Date.now()}`, 
      name: manualItemName.trim(), 
      price, 
      quantity: 1, 
      type: "manual" 
    }]);
    setManualItemName("");
    setManualItemPrice("");
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setSelectedItems(selectedItems.map(s => 
      s.id === itemId ? { ...s, quantity: Math.max(1, s.quantity + delta) } : s
    ));
  };

  const updatePrice = (itemId: string, newPrice: number) => {
    setSelectedItems(selectedItems.map(s => 
      s.id === itemId ? { ...s, price: newPrice } : s
    ));
  };

  const removeItem = (itemId: string) => {
    setSelectedItems(selectedItems.filter(s => s.id !== itemId));
  };

  const groupedServices = services.reduce((acc, service) => {
    const category = service.category || "Otros";
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const groupedProducts = products.reduce((acc, product) => {
    const category = product.category || "Otros";
    if (!acc[category]) acc[category] = [];
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  const clearAll = () => {
    setSelectedItems([]);
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
    setManualItemName("");
    setManualItemPrice("");
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      toast({ title: "Error", description: "Selecciona al menos un servicio o producto", variant: "destructive" });
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
      const servicesData = selectedItems.map(s => ({
        id: s.id, 
        name: s.name, 
        price: s.price, 
        quantity: s.quantity, 
        total: s.price * s.quantity,
        type: s.type
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
      {/* Left Column - Service/Product Selection */}
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

        {/* Manual item entry */}
        <Card className="border-dashed border-2 border-muted-foreground/30">
          <CardContent className="p-3 space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <PenLine className="h-4 w-4" />Añadir importe manual
            </Label>
            <div className="flex gap-2">
              <Input 
                value={manualItemName} 
                onChange={(e) => setManualItemName(e.target.value)} 
                placeholder="Concepto" 
                className="flex-1"
              />
              <Input 
                type="number" 
                value={manualItemPrice} 
                onChange={(e) => setManualItemPrice(e.target.value)} 
                placeholder="0.00" 
                className="w-24 text-right"
              />
              <Button size="icon" onClick={addManualItem} variant="secondary">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Accordion type="multiple" className="w-full" defaultValue={["servicios"]}>
          {/* Services */}
          <AccordionItem value="servicios">
            <AccordionTrigger className="text-sm font-medium">
              <div className="flex items-center gap-2">
                <Scissors className="h-4 w-4" />
                Servicios
                <Badge variant="secondary">{services.length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Accordion type="multiple" className="w-full pl-2">
                {Object.entries(groupedServices).map(([category, categoryServices]) => (
                  <AccordionItem key={category} value={category}>
                    <AccordionTrigger className="text-sm py-2">
                      {category}<Badge variant="outline" className="ml-2">{categoryServices.length}</Badge>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-1">
                        {categoryServices.map((service) => {
                          const isSelected = selectedItems.some(s => s.id === service.id && s.type === "service");
                          return (
                            <div key={service.id}
                              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50"}`}
                              onClick={() => toggleService(service)}>
                              <div className="flex items-center gap-2">
                                <Checkbox checked={isSelected} />
                                <span className="text-sm">{service.name}</span>
                              </div>
                              <span className="text-sm font-medium">{service.price ? formatCurrency(service.price) : "Sin precio"}</span>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </AccordionContent>
          </AccordionItem>

          {/* Products */}
          {products.length > 0 && (
            <AccordionItem value="productos">
              <AccordionTrigger className="text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Productos
                  <Badge variant="secondary">{products.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Accordion type="multiple" className="w-full pl-2">
                  {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
                    <AccordionItem key={category} value={`prod-${category}`}>
                      <AccordionTrigger className="text-sm py-2">
                        {category}<Badge variant="outline" className="ml-2">{categoryProducts.length}</Badge>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-1">
                          {categoryProducts.map((product) => {
                            const isSelected = selectedItems.some(s => s.id === product.id && s.type === "product");
                            return (
                              <div key={product.id}
                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50"}`}
                                onClick={() => toggleProduct(product)}>
                                <div className="flex items-center gap-2">
                                  <Checkbox checked={isSelected} />
                                  <span className="text-sm">{product.name}</span>
                                  <Badge variant="outline" className="text-xs">{product.stock} uds</Badge>
                                </div>
                                <span className="text-sm font-medium">{formatCurrency(product.price)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        {selectedItems.length > 0 && (
          <Card className="border-primary/20">
            <CardContent className="p-3 space-y-2">
              <Label className="text-xs text-muted-foreground">Items seleccionados</Label>
              {selectedItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-1 flex-1">
                    {item.type === "product" && <Package className="h-3 w-3 text-muted-foreground" />}
                    {item.type === "manual" && <PenLine className="h-3 w-3 text-muted-foreground" />}
                    <span className="truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center">{item.quantity}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  {(item.type === "manual" || !item.price) ? (
                    <Input 
                      type="number" 
                      value={item.price} 
                      onChange={(e) => updatePrice(item.id, parseFloat(e.target.value) || 0)}
                      className="w-20 h-7 text-right text-sm"
                    />
                  ) : (
                    <span className="font-medium w-20 text-right">{formatCurrency(item.price * item.quantity)}</span>
                  )}
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}>
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
              {getMixedRemaining() > 0.01 && (
                <p className="text-sm text-orange-600 text-center">Resta: {formatCurrency(getMixedRemaining())}</p>
              )}
              {getMixedRemaining() <= 0.01 && getMixedTotal() > 0 && (
                <p className="text-sm text-green-600 text-center flex items-center justify-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />Pago completo
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {(paymentMethod === "cash" || (paymentMethod === "mixed" && numericCashAmount > 0)) && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Efectivo entregado</Label>
            <Input type="number" value={cashGiven} onChange={(e) => setCashGiven(e.target.value)} placeholder="0.00" className="text-center text-lg" />
            {getChange() > 0 && (
              <p className="text-center text-lg font-bold text-green-600">Cambio: {formatCurrency(getChange())}</p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-sm font-medium">Notas (opcional)</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas adicionales..." rows={2} />
        </div>

        <Card className="bg-muted/50">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
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
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>TOTAL</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button variant="outline" onClick={clearAll} className="flex-1">Limpiar</Button>
          <Button onClick={handleSubmit} disabled={loading || selectedItems.length === 0} className="flex-1 gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Cobrar
          </Button>
        </div>
      </div>
    </div>
  );
};
