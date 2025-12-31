import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Loader2, Trash2, CalendarPlus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { AppLayout } from "@/components/navigation/AppLayout";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { BookingCard } from "@/components/bookings/BookingCard";
import { RescheduleFlow } from "@/components/booking/RescheduleFlow";
import { AnimatePresence } from "motion/react";

type Booking = {
  id: string;
  customer_name: string;
  Telefono: string;
  Fecha: string;
  Hora: string;
  stylist: string;
  services: any;
  total_duration: number;
  status: string;
};

const TABS = [
  { value: "upcoming", label: "Próximas" },
  { value: "history", label: "Historial" },
];

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [dateToCancel, setDateToCancel] = useState<string | null>(null);
  const [cancelingDate, setCancelingDate] = useState<string | null>(null);
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
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

  const handleCancelAllBookingsForDate = async () => {
    if (!dateToCancel) return;

    setCancelingDate(dateToCancel);
    try {
      const bookingsForDate = bookings.filter(b => b.Fecha === dateToCancel);
      const bookingIds = bookingsForDate.map(b => b.id);
      
      const { error: functionError } = await supabase.functions.invoke('cancel-booking', {
        body: { bookingIds, user: 'client' }
      });

      if (functionError) throw functionError;

      toast({
        title: "Citas canceladas",
        description: `Todas las citas del ${format(new Date(dateToCancel), "dd-MM-yyyy")} han sido canceladas`,
      });

      await loadBookings();
    } catch (error) {
      console.error('Error canceling bookings:', error);
      toast({
        title: "Error",
        description: "No se pudieron cancelar las citas",
        variant: "destructive",
      });
    } finally {
      setCancelingDate(null);
      setDateToCancel(null);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const upcomingBookings = bookings.filter(b => b.Fecha >= today);
  const pastBookings = bookings.filter(b => b.Fecha < today);
  const displayedBookings = activeTab === "upcoming" ? upcomingBookings : pastBookings;

  // Group by date
  const groupedBookings = displayedBookings.reduce((acc, booking) => {
    if (!acc[booking.Fecha]) acc[booking.Fecha] = [];
    acc[booking.Fecha].push(booking);
    return acc;
  }, {} as Record<string, Booking[]>);

  const sortedDates = Object.keys(groupedBookings).sort((a, b) => 
    activeTab === "upcoming" 
      ? new Date(a).getTime() - new Date(b).getTime()
      : new Date(b).getTime() - new Date(a).getTime()
  );

  if (loading) {
    return (
      <AppLayout>
        <SEO 
          title="Mis Citas"
          description="Gestiona tus reservas"
          canonicalUrl="/mis-citas"
          noindex={true}
        />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <SEO 
        title="Mis Citas"
        description="Gestiona tus reservas"
        canonicalUrl="/mis-citas"
        noindex={true}
      />
      
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 safe-area-top">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground mb-4">Mis Citas</h1>
          <SegmentedControl
            options={TABS}
            value={activeTab}
            onChange={setActiveTab}
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {displayedBookings.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              {activeTab === "upcoming" ? "No tienes citas próximas" : "No hay historial"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {activeTab === "upcoming" && "Reserva tu primera cita ahora"}
            </p>
            {activeTab === "upcoming" && (
              <Button onClick={() => navigate("/")}>
                <CalendarPlus className="h-4 w-4 mr-2" />
                Reservar cita
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <div key={date}>
                {/* Date Header */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    {format(new Date(date), "EEEE, d 'de' MMMM", { locale: es })}
                  </h3>
                  {activeTab === "upcoming" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDateToCancel(date)}
                      disabled={cancelingDate === date}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                    >
                      {cancelingDate === date ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-1" />
                          <span className="text-xs">Cancelar</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Bookings for date */}
                <div className="space-y-3">
                  {groupedBookings[date].map((booking) => (
                    <div key={booking.id} className="relative">
                      <BookingCard booking={booking} />
                      {activeTab === "upcoming" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRescheduleBooking(booking)}
                          className="absolute top-3 right-14 h-8 w-8 p-0 rounded-full bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-primary"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reschedule Flow */}
      <AnimatePresence>
        {rescheduleBooking && (
          <RescheduleFlow
            booking={rescheduleBooking}
            onClose={() => setRescheduleBooking(null)}
            onSuccess={() => {
              setRescheduleBooking(null);
              loadBookings();
            }}
          />
        )}
      </AnimatePresence>

      <AlertDialog open={!!dateToCancel} onOpenChange={() => setDateToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar citas?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a cancelar todas las citas del{" "}
              {dateToCancel && format(new Date(dateToCancel), "d 'de' MMMM", { locale: es })}.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, mantener</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelAllBookingsForDate}>
              Sí, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
