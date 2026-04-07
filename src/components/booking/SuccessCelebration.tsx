import { useRef, useEffect } from "react";
import { motion } from "motion/react";
import { CheckCircle2, Calendar, MessageCircle, MapPin, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Confetti, type ConfettiRef } from "@/components/ui/confetti";
import { format, differenceInDays, differenceInHours } from "date-fns";
import { es } from "date-fns/locale";
import { useHaptic } from "@/hooks/useHaptic";

interface SuccessCelebrationProps {
  bookingDate: Date;
  bookingTime: string;
  stylistName: string;
  services: { name: string }[];
  totalDuration: number;
  salonName?: string;
  salonAddress?: string;
  onAddToCalendar?: () => void;
  onShareWhatsApp?: () => void;
  onViewBookings?: () => void;
}

export function SuccessCelebration({
  bookingDate,
  bookingTime,
  stylistName,
  services,
  totalDuration,
  salonName,
  salonAddress,
  onAddToCalendar,
  onShareWhatsApp,
  onViewBookings,
}: SuccessCelebrationProps) {
  const confettiRef = useRef<ConfettiRef>(null);
  const haptic = useHaptic();

  // Calculate countdown
  const getCountdown = () => {
    const [hours, minutes] = bookingTime.split(":").map(Number);
    const appointmentDate = new Date(bookingDate);
    appointmentDate.setHours(hours, minutes, 0, 0);

    const now = new Date();
    const daysUntil = differenceInDays(appointmentDate, now);
    const hoursUntil = differenceInHours(appointmentDate, now) % 24;

    if (daysUntil === 0) {
      if (hoursUntil <= 0) return "¡Es hoy!";
      return `En ${hoursUntil}h`;
    }
    if (daysUntil === 1) return "Mañana";
    return `En ${daysUntil} días`;
  };

  useEffect(() => {
    // Fire confetti and haptic on mount
    haptic.success();

    const timer = setTimeout(() => {
      confettiRef.current?.fire({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.5 },
      });
    }, 300);

    // Second burst
    const timer2 = setTimeout(() => {
      confettiRef.current?.fire({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7, x: 0.3 },
      });
      confettiRef.current?.fire({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7, x: 0.7 },
      });
    }, 600);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [haptic]);

  const handleAddToCalendar = () => {
    haptic.selection();

    // Create Google Calendar URL
    const [hours, minutes] = bookingTime.split(":").map(Number);
    const startDate = new Date(bookingDate);
    startDate.setHours(hours, minutes, 0, 0);

    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + totalDuration);

    const formatDateForCalendar = (date: Date) => {
      return (
        date
          .toISOString()
          .replace(/-|:|\.\d+/g, "")
          .slice(0, 15) + "Z"
      );
    };

    const title = encodeURIComponent(`Cita en ${salonName || "Salón"}`);
    const details = encodeURIComponent(
      `Servicios: ${services.map((s) => s.name).join(", ")}\nProfesional: ${stylistName}`,
    );
    const location = encodeURIComponent(salonAddress || "");

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatDateForCalendar(startDate)}/${formatDateForCalendar(endDate)}&details=${details}&location=${location}`;

    window.open(googleCalendarUrl, "_blank");
    onAddToCalendar?.();
  };

  const handleShareWhatsApp = () => {
    haptic.selection();

    const formattedDate = format(bookingDate, "EEEE d 'de' MMMM", { locale: es });
    const message = `¡He cogido cita con GlowApp en ${salonName || "el salón"}! 💇‍♀️\n\n📅 ${formattedDate} a las ${bookingTime}\n💆 ${services.map((s) => s.name).join(", ")}\n\n¿Quedamos después? ✨`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
    onShareWhatsApp?.();
  };

  return (
    <div className="relative min-h-[60vh] flex flex-col items-center justify-center py-8 px-4">
      {/* Confetti Canvas */}
      <Confetti ref={confettiRef} className="fixed inset-0 w-full h-full pointer-events-none z-50" />

      {/* Success Icon with Animation */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 15,
          delay: 0.1,
        }}
        className="relative mb-6"
      >
        <div className="absolute inset-0 bg-green-400/30 rounded-full blur-xl animate-pulse" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg">
          <CheckCircle2 className="h-12 w-12 text-white" />
        </div>
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center mb-6"
      >
        <h2 className="text-3xl font-bold text-foreground mb-2">¡Reserva Confirmada!</h2>
        <p className="text-muted-foreground">Tu cita ha sido guardada correctamente</p>
      </motion.div>

      {/* Countdown Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="mb-6"
      >
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium">
          <Clock className="h-4 w-4" />
          {getCountdown()}
        </span>
      </motion.div>

      {/* Booking Details Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-sm bg-card border rounded-2xl p-5 shadow-sm mb-6"
      >
        <div className="space-y-4">
          {/* Date & Time */}
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">{format(bookingDate, "EEEE, d 'de' MMMM", { locale: es })}</p>
              <p className="text-sm text-muted-foreground">
                {bookingTime} · {totalDuration} min
              </p>
            </div>
          </div>

          {/* Stylist */}
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/50 flex-shrink-0">
              <User className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {stylistName === "any" ? "Siguiente disponible" : stylistName}
              </p>
              <p className="text-sm text-muted-foreground">{services.map((s) => s.name).join(", ")}</p>
            </div>
          </div>

          {/* Location */}
          {(salonName || salonAddress) && (
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/50 flex-shrink-0">
                <MapPin className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                {salonName && <p className="font-medium text-foreground">{salonName}</p>}
                {salonAddress && <p className="text-sm text-muted-foreground">{salonAddress}</p>}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-sm space-y-3"
      >
        <Button onClick={handleAddToCalendar} variant="outline" className="w-full h-12 gap-2">
          <Calendar className="h-5 w-5" />
          Añadir al Calendario
        </Button>

        <Button onClick={handleShareWhatsApp} variant="outline" className="w-full h-12 gap-2">
          <MessageCircle className="h-5 w-5" />
          Compartir por WhatsApp
        </Button>

        {onViewBookings && (
          <Button
            onClick={() => {
              haptic.selection();
              onViewBookings();
            }}
            className="w-full h-12"
          >
            Ver Mis Citas
          </Button>
        )}
      </motion.div>

      {/* Footer Message */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center text-sm text-muted-foreground mt-6"
      >
        Te esperamos con ilusión ✨
      </motion.p>
    </div>
  );
}
