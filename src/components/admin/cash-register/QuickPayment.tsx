import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Banknote, 
  CreditCard, 
  Search,
  User,
  Scissors,
  Percent,
  CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TodayBooking {
  id: string;
  customer_name: string;
  Telefono: string;
  Hora: string;
  stylist: string;
  services: any;
  google_calendar_event_id?: string | null;
}

interface Service {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface QuickPaymentProps {
  onTransactionCreated: () => void;
}

export const QuickPayment = ({ onTransactionCreated }: QuickPaymentProps) => {
  const [loading, setLoading] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [todayBookings, setTodayBookings] = useState<TodayBooking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<TodayBooking | null>(null);
  
  // Form state
  const [customerName, setCustomerName] = useState("");
  const [stylist, setStylist] = useState<"cris" | "desi">("cris");
  const [selectedServices, setSelectedServices] = useState<Array<{ name: string; price: number }>>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [notes, setNotes] = useState("");
  
  const { toast } = useToast();

  useEffect(() => {
    fetchTodayBookings();
    fetchServices();
  }, []);

  const fetchTodayBookings = async () => {
    try {
      setLoadingBookings(true);
      const today = format(new Date(), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("bookings")
        .select("id, customer_name, Telefono, Hora, stylist, services, google_calendar_event_id")
        .eq("Fecha", today)
        .eq("status", "confirmed")
        .order("Hora", { ascending: true });

      if (error) throw error;
      setTodayBookings(data || []);
    } catch (error: any) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoadingBookings(false);
    }
  };

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, price, category")
        .order("category", { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (error: any) {
      console.error("Error fetching services:", error);
    }
  };

  const handleSelectBooking = (booking: TodayBooking) => {
    setSelectedBooking(booking);
    setCustomerName(booking.customer_name);
    setStylist(booking.stylist.toLowerCase() as "cris" | "desi");
    
    // Map services with prices
    const bookingServices = (booking.services || []).map((s: any) => {
      const serviceData = services.find(
        (srv) => srv.name.toLowerCase() === (s.name || s).toLowerCase()
      );
      return {
        name: s.name || s,
        price: serviceData?.price || 0,
      };
    });
    setSelectedServices(bookingServices);
  };

  const handleAddService = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    if (service && !selectedServices.find((s) => s.name === service.name)) {
      setSelectedServices([...selectedServices, { name: service.name, price: service.price }]);
    }
  };

  const handleRemoveService = (serviceName: string) => {
    setSelectedServices(selectedServices.filter((s) => s.name !== serviceName));
  };

  const handleUpdateServicePrice = (serviceName: string, newPrice: number) => {
    setSelectedServices(
      selectedServices.map((s) =>
        s.name === serviceName ? { ...s, price: newPrice } : s
      )
    );
  };

  const subtotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const total = Math.max(0, subtotal - discount);

  const handleSubmit = async () => {
    if (!customerName.trim()) {
      toast({
        title: "Error",
        description: "Introduce el nombre del cliente",
        variant: "destructive",
      });
      return;
    }

    if (selectedServices.length === 0) {
      toast({
        title: "Error",
        description: "Añade al menos un servicio",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("No autenticado");
      }

      const { error } = await supabase.from("transactions").insert({
        booking_id: selectedBooking?.id || null,
        stylist,
        customer_name: customerName,
        services: selectedServices,
        subtotal,
        discount,
        total,
        payment_method: paymentMethod,
        notes: notes || null,
        created_by: user.id,
      });

      if (error) throw error;

      // Reset form
      setSelectedBooking(null);
      setCustomerName("");
      setSelectedServices([]);
      setDiscount(0);
      setNotes("");
      
      onTransactionCreated();
    } catch (error: any) {
      console.error("Error creating transaction:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo registrar el cobro",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Left: Booking Selection */}
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Citas de hoy</Label>
          <p className="text-xs text-muted-foreground mb-3">
            Selecciona una cita o crea un cobro manual
          </p>
          
          {loadingBookings ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : todayBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No hay citas para hoy
            </p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {todayBookings.map((booking) => (
                <Card
                  key={booking.id}
                  className={`cursor-pointer transition-all hover:border-primary/50 ${
                    selectedBooking?.id === booking.id
                      ? "border-primary bg-primary/5"
                      : ""
                  }`}
                  onClick={() => handleSelectBooking(booking)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{booking.customer_name}</span>
                          <Badge variant="outline" className="text-xs">
                            {booking.Hora.slice(0, 5)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {booking.stylist} • {booking.services?.map((s: any) => s.name || s).join(", ")}
                        </p>
                      </div>
                      {selectedBooking?.id === booking.id && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <Label className="text-sm font-medium">Cobro manual</Label>
          <p className="text-xs text-muted-foreground mb-3">
            O introduce los datos manualmente
          </p>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="customerName">Cliente</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="customerName"
                  placeholder="Nombre del cliente"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Estilista</Label>
              <RadioGroup
                value={stylist}
                onValueChange={(v) => setStylist(v as "cris" | "desi")}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cris" id="cris" />
                  <Label htmlFor="cris" className="cursor-pointer">Cris</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="desi" id="desi" />
                  <Label htmlFor="desi" className="cursor-pointer">Desi</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Services & Payment */}
      <div className="space-y-4">
        <div>
          <Label>Servicios</Label>
          <Select onValueChange={handleAddService}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Añadir servicio..." />
            </SelectTrigger>
            <SelectContent>
              {services.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  <div className="flex justify-between items-center w-full">
                    <span>{service.name}</span>
                    <span className="text-muted-foreground ml-2">
                      {formatCurrency(service.price)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedServices.length > 0 && (
            <div className="mt-3 space-y-2">
              {selectedServices.map((service, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Scissors className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={service.price}
                      onChange={(e) =>
                        handleUpdateServicePrice(service.name, Number(e.target.value))
                      }
                      className="w-20 h-8 text-right"
                      min={0}
                      step={0.01}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveService(service.name)}
                      className="h-8 w-8 p-0 text-destructive"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="discount">Descuento</Label>
          <div className="relative mt-2">
            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="discount"
              type="number"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="pl-10"
              min={0}
              step={0.01}
            />
          </div>
        </div>

        <div>
          <Label>Método de pago</Label>
          <RadioGroup
            value={paymentMethod}
            onValueChange={(v) => setPaymentMethod(v as "cash" | "card")}
            className="flex gap-4 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cash" id="cash" />
              <Label htmlFor="cash" className="cursor-pointer flex items-center gap-1">
                <Banknote className="h-4 w-4" />
                Efectivo
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="card" id="card" />
              <Label htmlFor="card" className="cursor-pointer flex items-center gap-1">
                <CreditCard className="h-4 w-4" />
                Tarjeta
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label htmlFor="notes">Notas (opcional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Añade notas..."
            className="mt-2"
            rows={2}
          />
        </div>

        {/* Total & Submit */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-destructive">
                  <span>Descuento</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleSubmit}
          disabled={loading || selectedServices.length === 0 || !customerName}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Registrando...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Registrar cobro - {formatCurrency(total)}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
