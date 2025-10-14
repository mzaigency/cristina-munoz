import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookingData } from "./BookingFlow";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  const handleConfirm = () => {
    if (name && phone) {
      onConfirm(name, phone);
      setConfirmed(true);
      toast({
        title: "¡Reserva confirmada!",
        description: "Te esperamos en nuestra peluquería.",
      });
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
