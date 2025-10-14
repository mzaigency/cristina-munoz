import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookingData } from "./BookingFlow";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BookingConfirmationProps {
  bookingData: BookingData;
  totalDuration: number;
  onConfirm: (name: string, phone: string) => void;
  onBack: () => void;
}

export const BookingConfirmation = ({
  bookingData,
  totalDuration,
  onConfirm,
  onBack,
}: BookingConfirmationProps) => {
  const [name, setName] = useState(bookingData.name);
  const [phone, setPhone] = useState(bookingData.phone);
  const [confirmed, setConfirmed] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    if (name && phone) {
      try {
        setConfirmed(true);
        
        // Call edge function to create booking and Google Calendar event
        // Format date in local timezone (Madrid)
        const bookingDate = bookingData.date ? 
          `${bookingData.date.getFullYear()}-${String(bookingData.date.getMonth() + 1).padStart(2, '0')}-${String(bookingData.date.getDate()).padStart(2, '0')}` 
          : '';
        
        const { data, error } = await supabase.functions.invoke('create-booking', {
          body: {
            customer_name: name,
            customer_phone: phone,
            booking_date: bookingDate,
            booking_time: bookingData.time,
            stylist: bookingData.stylist,
            services: bookingData.services.map(s => ({ name: s.name, duration: s.duration })),
            total_duration: totalDuration,
          },
        });

        if (error) {
          console.error('Error creating booking:', error);
          toast({
            title: "Error",
            description: "No se pudo completar la reserva. Por favor, intenta de nuevo.",
            variant: "destructive",
          });
          setConfirmed(false);
          return;
        }

        console.log('Booking created:', data);
        onConfirm(name, phone);
        toast({
          title: "¡Reserva confirmada!",
          description: data.googleEventCreated 
            ? "Tu cita ha sido añadida al calendario de la peluquería."
            : "Tu reserva ha sido guardada correctamente.",
        });
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Error",
          description: "Ocurrió un error al procesar tu reserva.",
          variant: "destructive",
        });
        setConfirmed(false);
      }
    }
  };

  if (confirmed) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-salon-pink-light">
            <CheckCircle2 className="h-10 w-10 text-salon-pink-dark" />
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-2xl font-bold text-foreground">¡Reserva Confirmada!</h3>
          <p className="text-muted-foreground">
            Te hemos enviado un mensaje de confirmación a tu teléfono.
          </p>
        </div>
        <div className="rounded-lg bg-salon-pink-light p-6 text-left">
          <h4 className="mb-3 font-semibold text-foreground">Resumen de tu cita:</h4>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Fecha:</span>{" "}
              {bookingData.date && format(bookingData.date, "PPP", { locale: es })}
            </p>
            <p>
              <span className="font-medium">Hora:</span> {bookingData.time}
            </p>
            <p>
              <span className="font-medium">Peluquera:</span>{" "}
              {bookingData.stylist === "any" ? "Cualquiera" : bookingData.stylist?.toUpperCase()}
            </p>
            <p>
              <span className="font-medium">Servicios:</span>{" "}
              {bookingData.services.map((s) => s.name).join(", ")}
            </p>
            <p>
              <span className="font-medium">Duración:</span> {totalDuration} minutos
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-salon-pink-light p-6">
        <h4 className="mb-3 font-semibold text-foreground">Resumen de tu reserva:</h4>
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-medium">Fecha:</span>{" "}
            {bookingData.date && format(bookingData.date, "PPP", { locale: es })}
          </p>
          <p>
            <span className="font-medium">Hora:</span> {bookingData.time}
          </p>
          <p>
            <span className="font-medium">Peluquera:</span>{" "}
            {bookingData.stylist === "any" ? "Cualquiera" : bookingData.stylist?.toUpperCase()}
          </p>
          <p>
            <span className="font-medium">Servicios:</span>{" "}
            {bookingData.services.map((s) => s.name).join(", ")}
          </p>
          <p>
            <span className="font-medium">Duración total:</span> {totalDuration} minutos
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Nombre completo</Label>
          <Input
            id="name"
            type="text"
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+34 600 000 000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Volver
        </Button>
        <Button onClick={handleConfirm} disabled={!name || !phone}>
          Confirmar Reserva
        </Button>
      </div>
    </div>
  );
};
