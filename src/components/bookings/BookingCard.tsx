import { Clock, User, ChevronRight, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "motion/react";

interface BookingCardProps {
  booking: {
    id: string;
    Fecha: string;
    Hora: string;
    stylist: string;
    services: any[];
    total_duration: number;
  };
  onClick?: () => void;
}

export function BookingCard({ booking, onClick }: BookingCardProps) {
  const getStylistName = (stylist: string) => {
    if (stylist === 'cris') return 'Cristina';
    if (stylist === 'desi') return 'Desi';
    return stylist;
  };

  const bookingDate = new Date(booking.Fecha);
  const isToday = new Date().toDateString() === bookingDate.toDateString();
  const isTomorrow = new Date(Date.now() + 86400000).toDateString() === bookingDate.toDateString();

  const getDateLabel = () => {
    if (isToday) return "Hoy";
    if (isTomorrow) return "Mañana";
    return format(bookingDate, "EEE d", { locale: es });
  };

  // Calculate countdown for today's bookings
  const getCountdown = () => {
    if (!isToday) return null;
    const [hours, minutes] = booking.Hora.split(':').map(Number);
    const bookingTime = new Date();
    bookingTime.setHours(hours, minutes, 0, 0);
    const diff = bookingTime.getTime() - Date.now();
    if (diff < 0) return null;
    const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
    const minsLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hoursLeft > 0) return `En ${hoursLeft}h ${minsLeft}m`;
    return `En ${minsLeft} min`;
  };

  const countdown = getCountdown();

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left rounded-2xl bg-card border border-border/50 p-4 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300"
    >
      <div className="flex items-center gap-4">
        {/* Time indicator with gradient */}
        <div className="relative flex flex-col items-center justify-center bg-gradient-to-br from-primary/15 to-accent/10 rounded-2xl p-3 min-w-[70px]">
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
            {getDateLabel()}
          </span>
          <span className="text-xl font-extrabold text-primary">{booking.Hora}</span>
          {countdown && (
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-semibold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full whitespace-nowrap">
              {countdown}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              {getStylistName(booking.stylist)}
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-1 mb-1.5">
            {Array.isArray(booking.services) 
              ? booking.services.map((s: any) => s.name).join(", ")
              : "Servicios"}
          </p>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {booking.total_duration} min
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(bookingDate, "d MMM", { locale: es })}
            </span>
          </div>
        </div>

        <div className="shrink-0 h-8 w-8 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </motion.button>
  );
}
