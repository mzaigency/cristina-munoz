import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Clock, User, Phone, Loader2, Trash2 } from "lucide-react";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type Booking = {
  id: string;
  customer_name: string;
  Telefono: string;
  Fecha: string;
  Hora: string;
  stylist: string;
  services: any; // JSONB field
  total_duration: number;
  status: string;
};

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [dateToCancel, setDateToCancel] = useState<string | null>(null);
  const [cancelingDate, setCancelingDate] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndLoadBookings();
  }, []);

  const checkAuthAndLoadBookings = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    await loadBookings();
  };

  const loadBookings = async () => {
    try {
      const { data, error } = await supabase.rpc('get_my_bookings');

      if (error) throw error;

      setBookings(data || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar tus citas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!bookingToCancel) return;

    setCancelingId(bookingToCancel.id);
    try {
      const { error: functionError } = await supabase.functions.invoke('cancel-booking', {
        body: { bookingId: bookingToCancel.id }
      });

      if (functionError) throw functionError;

      toast({
        title: "Cita cancelada",
        description: "Tu cita ha sido cancelada correctamente",
      });

      await loadBookings();
    } catch (error) {
      console.error('Error canceling booking:', error);
      toast({
        title: "Error",
        description: "No se pudo cancelar la cita. Por favor, contacta con nosotras.",
        variant: "destructive",
      });
    } finally {
      setCancelingId(null);
      setBookingToCancel(null);
    }
  };

  const handleCancelAllBookingsForDate = async () => {
    if (!dateToCancel) return;

    setCancelingDate(dateToCancel);
    try {
      const bookingsForDate = bookings.filter(b => b.Fecha === dateToCancel);
      
      // Cancelar todas las citas de ese día
      for (const booking of bookingsForDate) {
        const { error: functionError } = await supabase.functions.invoke('cancel-booking', {
          body: { bookingId: booking.id }
        });

        if (functionError) throw functionError;
      }

      toast({
        title: "Citas canceladas",
        description: `Todas las citas del ${format(new Date(dateToCancel), "dd-MM-yyyy")} han sido canceladas correctamente`,
      });

      await loadBookings();
    } catch (error) {
      console.error('Error canceling bookings for date:', error);
      toast({
        title: "Error",
        description: "No se pudieron cancelar las citas. Por favor, contacta con nosotras.",
        variant: "destructive",
      });
    } finally {
      setCancelingDate(null);
      setDateToCancel(null);
    }
  };

  const getStylistName = (stylist: string) => {
    if (stylist === 'cris') return 'Cristina';
    if (stylist === 'desi') return 'Desi';
    return stylist;
  };

  // Agrupar citas por fecha
  const groupBookingsByDate = () => {
    const grouped: { [key: string]: Booking[] } = {};
    
    bookings.forEach(booking => {
      if (!grouped[booking.Fecha]) {
        grouped[booking.Fecha] = [];
      }
      grouped[booking.Fecha].push(booking);
    });

    // Ordenar fechas de más reciente a más antigua
    return Object.entries(grouped).sort((a, b) => 
      new Date(b[0]).getTime() - new Date(a[0]).getTime()
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header onNavigate={() => {}} activeSection="" />
        <div className="container mx-auto px-4 py-20 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onNavigate={() => {}} activeSection="" />
      
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Tus Citas</h1>
            <p className="text-muted-foreground">
              Aquí puedes ver y gestionar tus próximas citas
            </p>
          </div>

          {bookings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">No tienes citas programadas</p>
                <Button onClick={() => navigate("/#reserva")}>
                  Reservar una cita
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Accordion type="single" collapsible className="space-y-4">
              {groupBookingsByDate().map(([date, dateBookings]) => (
                <AccordionItem key={date} value={date} className="border rounded-lg">
                  <AccordionTrigger className="px-6 hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div className="text-left">
                          <p className="font-semibold text-lg">
                            {format(new Date(date), "dd-MM-yyyy")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {dateBookings.length} {dateBookings.length === 1 ? 'cita' : 'citas'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDateToCancel(date);
                        }}
                        disabled={cancelingDate === date}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        {cancelingDate === date ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Cancelando...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Cancelar día
                          </>
                        )}
                      </Button>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <div className="space-y-3 pt-2">
                      {dateBookings.map((booking) => (
                        <Card key={booking.id} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{booking.Hora}</span>
                                <span className="text-sm text-muted-foreground">
                                  ({booking.total_duration} min)
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setBookingToCancel(booking)}
                                disabled={cancelingId === booking.id}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
                              >
                                {cancelingId === booking.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Cancelar"
                                )}
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Peluquera:</span>
                                <span>{getStylistName(booking.stylist)}</span>
                              </div>
                              
                              <div>
                                <p className="text-sm font-medium mb-1">Servicios:</p>
                                <ul className="list-disc list-inside space-y-1">
                                  {Array.isArray(booking.services) && booking.services.map((service: any, idx: number) => (
                                    <li key={idx} className="text-sm text-muted-foreground">
                                      {service.name}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </main>

      <AlertDialog open={!!bookingToCancel} onOpenChange={() => setBookingToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar cita?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás segura de que quieres cancelar esta cita? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, mantener cita</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelBooking}>
              Sí, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!dateToCancel} onOpenChange={() => setDateToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar todas las citas del día?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás segura de que quieres cancelar todas las citas del{" "}
              {dateToCancel && format(new Date(dateToCancel), "dd-MM-yyyy")}? 
              Esta acción no se puede deshacer y se eliminarán todas las citas de ese día.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, mantener citas</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelAllBookingsForDate}>
              Sí, cancelar todas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}