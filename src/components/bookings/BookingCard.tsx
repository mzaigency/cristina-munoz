import { Clock, User, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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
    return format(bookingDate, "EEEE, d MMM", { locale: es });
  };

  return (
    <button
      onClick={onClick}
      className="ios-list-item w-full text-left active:scale-[0.98] transition-transform"
    >
      <div className="flex items-center gap-4">
        {/* Time indicator */}
        <div className="flex flex-col items-center justify-center bg-primary/10 rounded-2xl p-3 min-w-[60px]">
          <span className="text-xs font-medium text-primary uppercase">
            {getDateLabel()}
          </span>
          <span className="text-lg font-bold text-primary">{booking.Hora}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {getStylistName(booking.stylist)}
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-1">
            {Array.isArray(booking.services) 
              ? booking.services.map((s: any) => s.name).join(", ")
              : "Servicios"}
          </p>

          <div className="flex items-center gap-1 mt-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {booking.total_duration} min
            </span>
          </div>
        </div>

        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
      </div>
    </button>
  );
}
