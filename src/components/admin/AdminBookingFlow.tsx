import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ServiceSelection } from "@/components/booking/ServiceSelection";
import { StylistSelection } from "@/components/booking/StylistSelection";
import { DateTimeSelection } from "@/components/booking/DateTimeSelection";
import { Loader2 } from "lucide-react";
import { phoneSchema } from "@/lib/phoneValidation";
import { Service, Stylist } from "@/types/booking";

interface AdminBookingData {
  services: Service[];
  stylist: Stylist | null;
  date: Date | null;
  time: string;
  customerName: string;
  customerPhone: string;
  skipAvailabilityCheck?: boolean;
}

interface AdminBookingFlowProps {
  onComplete: () => void;
  onCancel: () => void;
  tenantId: string;
}

export const AdminBookingFlow = ({ onComplete, onCancel, tenantId }: AdminBookingFlowProps) => {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState<AdminBookingData>({
    services: [],
    stylist: null,
    date: null,
    time: "",
    customerName: "",
    customerPhone: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data, error } = await supabase.from("services").select("*").eq("tenant_id", tenantId).order("name");

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los servicios",
        variant: "destructive",
      });
      return;
    }

    // Add computed duration field and type cast
    const servicesWithDuration = (data || []).map(service => ({
      ...service,
      type: service.type as 'Simple' | 'Compuesto',
      duration: service.duration_part1_active + service.duration_exposure_pause + service.duration_part2_active
    }));

    setServices(servicesWithDuration);
  };

  const totalDuration = bookingData.services.reduce(
    (sum, service) =>
      sum + service.duration_part1_active + service.duration_exposure_pause + service.duration_part2_active,
    0
  );

  const handleServicesSelect = (selectedServices: Service[]) => {
    setBookingData({ ...bookingData, services: selectedServices });
    setStep(2);
  };

  const handleStylistSelect = (stylist: Stylist) => {
    setBookingData({ ...bookingData, stylist });
    setStep(3);
  };

  const handleDateTimeSelect = (date: Date, time: string, resolvedStylist?: Stylist, skipAvailabilityCheck?: boolean) => {
    // If a resolved stylist is provided (from 'any' selection), use it instead
    const finalStylist = resolvedStylist || bookingData.stylist;
    setBookingData({ ...bookingData, date, time, stylist: finalStylist, skipAvailabilityCheck });
    setStep(4);
  };

  const handleConfirmBooking = async () => {
    // Validate phone only if provided
    if (bookingData.customerPhone.trim()) {
      const phoneValidation = phoneSchema.safeParse(bookingData.customerPhone);
      if (!phoneValidation.success) {
        toast({
          title: "Error",
          description: phoneValidation.error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    if (!bookingData.customerName.trim()) {
      toast({
        title: "Error",
        description: "El nombre es requerido",
        variant: "destructive",
      });
      return;
    }

    // Determine if we should skip availability checks
    // This is set in DateTimeSelection when admin uses custom time
    const skipAvailabilityCheck = bookingData.skipAvailabilityCheck || false;

    try {
      setLoading(true);

      const bookingPayload = {
        customer_name: bookingData.customerName,
        phone: bookingData.customerPhone,
        services: bookingData.services.map((s) => ({
          id: s.id,
          name: s.name,
          duration_part1_active: s.duration_part1_active,
          duration_exposure_pause: s.duration_exposure_pause,
          duration_part2_active: s.duration_part2_active,
          type: s.type,
        })),
        // Format date in local timezone to avoid timezone issues
        date: `${bookingData.date!.getFullYear()}-${String(bookingData.date!.getMonth() + 1).padStart(2, '0')}-${String(bookingData.date!.getDate()).padStart(2, '0')}`,
        time: bookingData.time,
        stylist: bookingData.stylist,
        total_duration: totalDuration,
        skipAvailabilityCheck, // Pass the flag to skip validations
        tenant_id: tenantId,
      };

      const { error } = await supabase.functions.invoke("create-booking", {
        body: bookingPayload,
      });

      if (error) throw error;

      toast({
        title: "¡Cita creada!",
        description: "La cita se ha creado correctamente",
      });

      onComplete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al crear la cita",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onCancel();
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <div className="p-6">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  s <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {s}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Servicios</span>
            <span>Peluquera</span>
            <span>Fecha/Hora</span>
            <span>Contacto</span>
          </div>
        </div>

        {/* Step Content */}
        {step === 1 && (
          <ServiceSelection
            services={services}
            selectedServices={bookingData.services}
            onNext={handleServicesSelect}
          />
        )}

        {step === 2 && (
          <StylistSelection
            selectedStylist={bookingData.stylist}
            onNext={handleStylistSelect}
            onBack={handleBack}
          />
        )}

        {step === 3 && (
          <DateTimeSelection
            selectedDate={bookingData.date}
            selectedTime={bookingData.time}
            totalDuration={totalDuration}
            services={bookingData.services}
            stylist={bookingData.stylist!}
            onNext={handleDateTimeSelect}
            onBack={handleBack}
            isAdmin={true}
          />
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Datos del cliente</h3>
              
              <div className="space-y-2">
                <Label htmlFor="customerName">Nombre completo</Label>
                <Input
                  id="customerName"
                  value={bookingData.customerName}
                  onChange={(e) => setBookingData({ ...bookingData, customerName: e.target.value })}
                  placeholder="Nombre del cliente"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerPhone">Teléfono (opcional)</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={bookingData.customerPhone}
                  onChange={(e) => setBookingData({ ...bookingData, customerPhone: e.target.value })}
                  placeholder="Ej: 612345678"
                />
                <p className="text-xs text-muted-foreground">Si se proporciona, se enviará recordatorio por WhatsApp</p>
              </div>

              <div className="pt-4 border-t space-y-2">
                <h4 className="font-medium">Resumen de la cita:</h4>
                <p className="text-sm text-muted-foreground">
                  <strong>Servicios:</strong> {bookingData.services.map((s) => s.name).join(", ")}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Peluquera:</strong> {bookingData.stylist === "any" ? "Cualquiera" : bookingData.stylist === "cris" ? "Cris" : "Desi"}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Fecha y hora:</strong> {bookingData.date?.toLocaleDateString("es-ES")} a las {bookingData.time}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Duración total:</strong> {totalDuration} minutos
                </p>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack} disabled={loading}>
                Volver
              </Button>
              <Button onClick={handleConfirmBooking} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear Cita"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
