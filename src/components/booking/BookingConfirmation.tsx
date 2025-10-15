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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { phoneSchema, cleanPhoneNumber } from "@/lib/phoneValidation";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface BookingConfirmationProps {
  bookingData: BookingData;
  totalDuration: number;
  onConfirm: (name: string, phone: string) => void;
  onBack: () => void;
}

const formSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido").max(100, "El nombre debe tener menos de 100 caracteres"),
  phone: phoneSchema,
});

type FormValues = z.infer<typeof formSchema>;

export const BookingConfirmation = ({
  bookingData,
  totalDuration,
  onConfirm,
  onBack,
}: BookingConfirmationProps) => {
  const [confirmed, setConfirmed] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: bookingData.name || "",
      phone: bookingData.phone || "",
    },
  });

  const handleConfirm = async (values: FormValues) => {
    try {
      setConfirmed(true);
      
      // Clean phone number (remove extra spaces and separators)
      const cleanPhone = cleanPhoneNumber(values.phone);
      
      // Call edge function to create booking and Google Calendar event
      // Format date in local timezone (Madrid)
      const bookingDate = bookingData.date ? 
        `${bookingData.date.getFullYear()}-${String(bookingData.date.getMonth() + 1).padStart(2, '0')}-${String(bookingData.date.getDate()).padStart(2, '0')}` 
        : '';
      
      const { data, error } = await supabase.functions.invoke('create-booking', {
        body: {
          customer_name: values.name,
          Telefono: cleanPhone,
          Fecha: bookingDate,
          Hora: bookingData.time,
          stylist: bookingData.stylist,
          services: bookingData.services.map(s => ({ 
            id: s.id,
            name: s.name,
            type: s.type,
            duration_part1_active: s.duration_part1_active,
            duration_exposure_pause: s.duration_exposure_pause,
            duration_part2_active: s.duration_part2_active,
          })),
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
      onConfirm(values.name, values.phone);
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
  };

  if (confirmed) {
    const formValues = form.getValues();
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
              <span className="font-medium">Nombre:</span> {formValues.name}
            </p>
            <p>
              <span className="font-medium">Teléfono:</span> {formValues.phone}
            </p>
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleConfirm)} className="space-y-6">
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
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre completo</FormLabel>
                <FormControl>
                  <Input placeholder="Tu nombre" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="600 000 000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            Volver
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Confirmando..." : "Confirmar Reserva"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
