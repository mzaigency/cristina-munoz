import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, Calendar, Clock, User, Trash2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { phoneSchema, cleanPhoneNumber } from "@/lib/phoneValidation";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type DbBooking = Database["public"]["Tables"]["bookings"]["Row"];

type Booking = {
  id: string;
  Fecha: string;
  Hora: string;
  customer_name: string;
  services: Array<{ name: string }>;
  stylist: string;
  google_calendar_event_id: string | null;
  calendar_id: string | null;
  is_part_of_compound: boolean;
  compound_part: string | null;
  related_booking_id: string | null;
};

const searchSchema = z.object({
  phone: phoneSchema,
});

type SearchFormValues = z.infer<typeof searchSchema>;

export const CancelBooking = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [lastSearchedPhone, setLastSearchedPhone] = useState("");
  const { toast } = useToast();
  
  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      phone: "",
    },
  });

  const handleSearch = async (values: SearchFormValues) => {
    setLoading(true);
    try {
      // Clean the phone number (remove spaces and common separators)
      const cleanPhone = cleanPhoneNumber(values.phone);
      setLastSearchedPhone(cleanPhone);
      
      // Use the secure RPC function instead of direct query
      const { data, error } = await supabase
        .rpc("search_my_bookings", { phone_number: cleanPhone });

      if (error) throw error;

      // Transform the data to match our Booking type
      const transformedData: Booking[] = (data || []).map((booking: any) => ({
        id: booking.id,
        Fecha: booking.Fecha,
        Hora: booking.Hora,
        customer_name: booking.customer_name,
        services: Array.isArray(booking.services) ? booking.services as Array<{ name: string }> : [],
        stylist: booking.stylist,
        google_calendar_event_id: booking.google_calendar_event_id,
        calendar_id: booking.calendar_id,
        is_part_of_compound: booking.is_part_of_compound || false,
        compound_part: booking.compound_part,
        related_booking_id: booking.related_booking_id,
      }));

      // Filter to show only Part 1 of compound services or simple services
      // This way users see one entry per service
      const displayBookings = transformedData.filter(booking => 
        !booking.is_part_of_compound || booking.compound_part === 'part1'
      );

      setBookings(displayBookings);

      if (displayBookings.length === 0) {
        toast({
          title: "Sin citas",
          description: "No se encontraron citas para este número de teléfono",
        });
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las citas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;

    setCancelling(true);
    try {
        const { error } = await supabase.functions.invoke("cancel-booking", {
          body: {
            bookingId: selectedBooking.id,
            googleEventId: selectedBooking.google_calendar_event_id,
            calendarId: selectedBooking.calendar_id,
            customerPhone: lastSearchedPhone,
            user: 'client',
          },
        });

      if (error) throw error;

      toast({
        title: "Cita cancelada",
        description: "Tu cita ha sido cancelada exitosamente",
      });

      // Remove the cancelled booking from the list
      setBookings(bookings.filter((b) => b.id !== selectedBooking.id));
      setShowConfirmDialog(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast({
        title: "Error",
        description: "No se pudo cancelar la cita. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setCancelling(false);
    }
  };

  const getStylistName = (stylist: string) => {
    if (stylist === "cris") return "Cris";
    if (stylist === "desi") return "Desi";
    return "Cualquier peluquera";
  };

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Cancelar Cita
          </h2>
          <p className="text-lg text-muted-foreground">
            Ingresa tu número de teléfono para ver y cancelar tus citas
          </p>
        </div>

        <div className="mx-auto max-w-2xl">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Buscar mis citas</CardTitle>
              <CardDescription>
                Ingresa tu número de teléfono
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSearch)} className="space-y-2">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de teléfono</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="612345678"
                              {...field}
                            />
                          </FormControl>
                          <Button type="submit" disabled={loading}>
                            {loading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Buscando
                              </>
                            ) : (
                              "Buscar"
                            )}
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>

              {bookings.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Tus citas</h3>
                  <div className="space-y-3">
                    {bookings.map((booking) => (
                      <Card key={booking.id} className="border">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {format(new Date(booking.Fecha), "EEEE, d 'de' MMMM 'de' yyyy", {
                                    locale: es,
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{booking.Hora}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>{getStylistName(booking.stylist)}</span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Servicios: {booking.services.map((s) => s.name).join(", ")}
                              </div>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setShowConfirmDialog(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar esta cita?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La cita será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelBooking}
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelando
                </>
              ) : (
                "Cancelar cita"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};
