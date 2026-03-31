import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, isTomorrow, isThisWeek } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Loader2, CalendarPlus, ChevronRight, X, Star, Sparkles } from "lucide-react";
import { BookingSkeleton } from "@/components/ui/BookingSkeleton";
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
import { RescheduleFlow } from "@/components/booking/RescheduleFlow";
import { AnimatePresence, motion } from "motion/react";
import { parseISODateToLocal } from "@/lib/datetime";
import { formatTimeHHmm } from "@/lib/datetime";
import { cn } from "@/lib/utils";

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
  tenant_id?: string;
  tenant_name?: string;
  tenant_slug?: string;
  tenant_logo_url?: string;
  tenant_phone?: string;
  tenant_address?: string;
  is_part_of_compound?: boolean;
  compound_part?: string;
  related_booking_id?: string;
};

const TABS = [
  { value: "upcoming", label: "Próximas" },
  { value: "history", label: "Historial" },
];

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "history" ? "history" : "upcoming";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [dateToCancel, setDateToCancel] = useState<string | null>(null);
  const [cancelingDate, setCancelingDate] = useState<string | null>(null);
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    loadBookings();
  }, [user, authLoading]);

  const loadBookings = async () => {
    try {
      const { data, error } = await supabase.rpc("get_my_bookings");
      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error loading bookings:", error);
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
      const bookingsForDate = bookings.filter((b) => b.Fecha === dateToCancel);
      const bookingIds = bookingsForDate.map((b) => b.id);

      const { error: functionError } = await supabase.functions.invoke("cancel-booking", {
        body: { bookingIds, user: "client" },
      });

      if (functionError) throw functionError;

      toast({
        title: "Citas canceladas",
        description: `Todas las citas del ${format(parseISODateToLocal(dateToCancel), "dd-MM-yyyy")} han sido canceladas`,
      });

      await loadBookings();
    } catch (error) {
      console.error("Error canceling bookings:", error);
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

  const handleOpenChat = (booking: Booking) => {
    if (booking.tenant_id) {
      navigate(`/mensajes?tenant=${booking.tenant_id}`);
      return;
    }
    navigate("/mensajes");
  };

  const getStylistName = (stylist: string) => {
    if (stylist === "cris") return "Cristina";
    if (stylist === "desi") return "Desi";
    return stylist.charAt(0).toUpperCase() + stylist.slice(1);
  };

  const getDateLabel = (dateStr: string) => {
    const date = parseISODateToLocal(dateStr);
    if (isToday(date)) return "Hoy";
    if (isTomorrow(date)) return "Mañana";
    if (isThisWeek(date)) return format(date, "EEEE", { locale: es });
    return format(date, "EEEE d", { locale: es });
  };

  const getCountdown = (dateStr: string, hora: string) => {
    const date = parseISODateToLocal(dateStr);
    if (!isToday(date)) return null;

    const [hours, minutes] = hora.split(":").map(Number);
    const bookingTime = new Date();
    bookingTime.setHours(hours, minutes, 0, 0);
    const diff = bookingTime.getTime() - Date.now();

    if (diff < 0) return null;
    const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
    const minsLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hoursLeft > 0) return `En ${hoursLeft}h ${minsLeft}m`;
    return `En ${minsLeft} min`;
  };

  const today = format(new Date(), "yyyy-MM-dd");

  // Filtrar citas compuestas: solo mostrar la cita principal (part1), no la secundaria (part2)
  // Para el cliente, un servicio compuesto es UNA sola cita
  const visibleBookings = bookings.filter((b) => {
    // Si es parte de un compuesto y es la parte 2, no mostrar
    if (b.is_part_of_compound && b.compound_part === "part2") {
      return false;
    }
    return true;
  });

  const upcomingBookings = visibleBookings.filter((b) => b.Fecha >= today);
  const pastBookings = visibleBookings.filter((b) => b.Fecha < today);
  const displayedBookings = activeTab === "upcoming" ? upcomingBookings : pastBookings;

  // Group by date
  const groupedBookings = displayedBookings.reduce(
    (acc, booking) => {
      if (!acc[booking.Fecha]) acc[booking.Fecha] = [];
      acc[booking.Fecha].push(booking);
      return acc;
    },
    {} as Record<string, Booking[]>,
  );

  const sortedDates = Object.keys(groupedBookings).sort((a, b) =>
    activeTab === "upcoming"
      ? parseISODateToLocal(a).getTime() - parseISODateToLocal(b).getTime()
      : parseISODateToLocal(b).getTime() - parseISODateToLocal(a).getTime(),
  );

  if (loading) {
    return (
      <AppLayout>
        <SEO title="Mis Citas" description="Gestiona tus reservas" canonicalUrl="/mis-citas" noindex={true} />
        <div className="sticky top-0 z-40 liquid-glass-solid pt-[env(safe-area-inset-top)]">
          <div className="px-4 py-3">
            <h1 className="text-[28px] font-bold text-foreground tracking-tight">Mis Citas</h1>
          </div>
        </div>
        <div className="px-4 py-4">
          <BookingSkeleton />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <SEO title="Mis Citas" description="Gestiona tus reservas" canonicalUrl="/mis-citas" noindex={true} />

      {/* iOS-style Header */}
      <div className="sticky top-0 z-40 liquid-glass-solid pt-[env(safe-area-inset-top)]">
        <div className="px-4 py-3">
          <h1 className="text-[28px] font-bold text-foreground tracking-tight">Mis Citas</h1>
        </div>
        <div className="px-4 pb-3">
          <SegmentedControl options={TABS} value={activeTab} onChange={setActiveTab} />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 pb-8">
        <AnimatePresence mode="wait">
          {displayedBookings.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-16 px-6"
            >
              {/* Animated icon with liquid glass */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
                className="relative mb-6"
              >
                <div className="w-24 h-24 rounded-[28px] liquid-glass-card flex items-center justify-center">
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  >
                    {activeTab === "upcoming" ? (
                      <CalendarPlus className="h-11 w-11 text-primary" />
                    ) : (
                      <Calendar className="h-11 w-11 text-muted-foreground/60" />
                    )}
                  </motion.div>
                </div>
              </motion.div>

              <motion.h3
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-bold text-foreground mb-2 tracking-tight"
              >
                {activeTab === "upcoming" ? "Sin citas próximas" : "Sin historial"}
              </motion.h3>

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-muted-foreground mb-8 max-w-[280px] text-center leading-relaxed"
              >
                {activeTab === "upcoming"
                  ? "Descubre salones cerca de ti y reserva tu primera cita en segundos"
                  : "Aquí aparecerán tus citas pasadas"}
              </motion.p>

              {activeTab === "upcoming" && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col items-center gap-3 w-full max-w-[260px]"
                >
                  <Button
                    onClick={() => navigate("/")}
                    size="lg"
                    className="w-full h-14 rounded-2xl text-base font-semibold shadow-lg shadow-primary/25 gradient-primary border-0"
                  >
                    <CalendarPlus className="h-5 w-5 mr-2" />
                    Explorar salones
                  </Button>
                  <span className="text-xs text-muted-foreground/60">
                    Reserva online al instante
                  </span>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {sortedDates.map((date, groupIndex) => {
                const dateObj = parseISODateToLocal(date);
                const isTodayDate = isToday(dateObj);

                return (
                  <motion.section
                    key={date}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: groupIndex * 0.1 }}
                    aria-label={`Citas del ${date}`}
                  >
                    {/* Date Header - iOS style */}
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-2">
                        <h2
                          className={cn(
                            "text-sm font-semibold capitalize",
                            isTodayDate ? "text-primary" : "text-muted-foreground",
                          )}
                        >
                          {getDateLabel(date)}
                        </h2>
                        <span className="text-sm text-muted-foreground">
                          {format(dateObj, "d MMM", { locale: es })}
                        </span>
                      </div>
                      {activeTab === "upcoming" && (
                        <button
                          onClick={() => setDateToCancel(date)}
                          disabled={cancelingDate === date}
                          className="text-xs text-destructive font-medium px-3 py-1.5 rounded-full bg-destructive/10 active:bg-destructive/20 transition-colors"
                        >
                          {cancelingDate === date ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Cancelar"}
                        </button>
                      )}
                    </div>

                    {/* Booking Cards */}
                    <div className="space-y-3">
                      {groupedBookings[date].map((booking, index) => {
                        const countdown = getCountdown(booking.Fecha, booking.Hora);
                        const logoUrl = booking.tenant_logo_url;

                        return (
                          <motion.div
                            key={booking.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="liquid-glass-card !rounded-2xl p-4 active:scale-[0.98] transition-transform"
                          >
                            {/* Countdown badge */}
                            {countdown && (
                              <div className="mb-3">
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 px-3 py-1.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  {countdown}
                                </span>
                              </div>
                            )}

                            <div className="flex items-start gap-4">
                              {/* Time & Logo */}
                              <div className="flex flex-col items-center">
                                {logoUrl ? (
                                  <img
                                    src={logoUrl}
                                    alt={booking.tenant_name || "Salón"}
                                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-border/50 shadow-sm"
                                  />
                                ) : (
                                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                    <Calendar className="h-6 w-6 text-primary" />
                                  </div>
                                )}
                                <span className="text-lg font-bold text-foreground mt-2">
                                  {formatTimeHHmm(booking.Hora)}
                                </span>
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                {booking.tenant_name && (
                                  <h3 className="text-base font-semibold text-foreground mb-1 line-clamp-1">
                                    {booking.tenant_name}
                                  </h3>
                                )}

                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                  {Array.isArray(booking.services)
                                    ? booking.services.map((s: any) => s.name).join(" · ")
                                    : "Servicios"}
                                </p>

                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="font-medium text-foreground/80">
                                    {getStylistName(booking.stylist)}
                                  </span>
                                  <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                                  <span>{booking.total_duration} min</span>
                                </div>
                              </div>

                              {/* Arrow */}
                              <div className="shrink-0 self-center">
                                <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
                              </div>
                            </div>

                            {/* Actions */}
                            {activeTab === "upcoming" && (
                              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
                                <button
                                  onClick={() => setRescheduleBooking(booking)}
                                  className="flex-1 h-10 rounded-xl liquid-glass-pill !rounded-xl text-sm font-medium text-foreground active:bg-secondary/80 transition-colors"
                                >
                                  Reagendar
                                </button>
                                <button
                                  onClick={() => handleOpenChat(booking)}
                                  className="flex-1 h-10 rounded-xl bg-primary/10 text-sm font-medium text-primary active:bg-primary/20 transition-colors"
                                >
                                  Mensaje
                                </button>
                              </div>
                            )}

                            {/* Review button for history */}
                            {activeTab === "history" && booking.tenant_slug && (
                              <div className="mt-4 pt-3 border-t border-border/50">
                                <button
                                  onClick={() => navigate(`/${booking.tenant_slug}?review=true`)}
                                  className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-sm font-semibold text-white flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-[0.98] transition-transform"
                                >
                                  <Star className="h-4 w-4" />
                                  Dejar valoración
                                </button>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.section>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
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

      {/* Cancel Dialog - iOS style */}
      <AlertDialog open={!!dateToCancel} onOpenChange={() => setDateToCancel(null)}>
        <AlertDialogContent className="rounded-3xl max-w-[340px] p-0 overflow-hidden">
          <AlertDialogHeader className="p-6 pb-4 text-center">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <X className="h-7 w-7 text-destructive" />
            </div>
            <AlertDialogTitle className="text-lg">¿Cancelar citas?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Vas a cancelar todas las citas del{" "}
              <span className="font-medium text-foreground">
                {dateToCancel && format(parseISODateToLocal(dateToCancel), "EEEE d 'de' MMMM", { locale: es })}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col border-t border-border/50 p-0 sm:flex-col sm:space-x-0">
            <AlertDialogAction
              onClick={handleCancelAllBookingsForDate}
              className="h-14 rounded-none border-b border-border/50 bg-transparent text-destructive font-semibold hover:bg-destructive/5 m-0"
            >
              Sí, cancelar
            </AlertDialogAction>
            <AlertDialogCancel className="h-14 rounded-none bg-transparent text-primary font-semibold hover:bg-primary/5 m-0 border-0">
              Mantener citas
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
