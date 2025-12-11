import { motion, AnimatePresence } from "motion/react";
import { Clock, Scissors, User, Calendar, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Service, Stylist, BookingData } from "./BookingFlow";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface BookingSummaryProps {
  bookingData: BookingData;
  totalDuration: number;
  step: number;
  onRemoveService?: (serviceId: string) => void;
}

const stylistNames: Record<Stylist, string> = {
  cris: "Cristina",
  desi: "Desirée",
  any: "Cualquiera",
};

export const BookingSummary = ({ 
  bookingData, 
  totalDuration, 
  step,
  onRemoveService 
}: BookingSummaryProps) => {
  const hasServices = bookingData.services.length > 0;
  
  if (!hasServices) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="sticky top-24 z-20"
    >
      <div className="glass rounded-2xl p-4 border border-border/50 shadow-lg">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
          <Scissors className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">Tu reserva</h3>
        </div>

        {/* Services List */}
        <div className="space-y-2 mb-3">
          <AnimatePresence mode="popLayout">
            {bookingData.services.map((service) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between gap-2 text-xs group"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span className="text-muted-foreground truncate">{service.name}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-muted-foreground/70">{service.duration}min</span>
                  {step === 1 && onRemoveService && (
                    <button
                      onClick={() => onRemoveService(service.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-destructive/10 rounded"
                    >
                      <X className="h-3 w-3 text-destructive" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary Info */}
        <div className="space-y-2 pt-2 border-t border-border/50">
          {/* Total Duration */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Duración total</span>
            </div>
            <span className="font-medium text-foreground">{totalDuration} min</span>
          </div>

          {/* Stylist */}
          <AnimatePresence>
            {bookingData.stylist && step >= 2 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between text-xs overflow-hidden"
              >
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  <span>Peluquera</span>
                </div>
                <span className="font-medium text-foreground">
                  {stylistNames[bookingData.stylist]}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Date & Time */}
          <AnimatePresence>
            {bookingData.date && bookingData.time && step >= 3 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between text-xs overflow-hidden"
              >
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Fecha</span>
                </div>
                <span className="font-medium text-foreground">
                  {format(bookingData.date, "d MMM", { locale: es })} - {bookingData.time}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Progress indicator */}
        <div className="mt-3 pt-2 border-t border-border/50">
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1 flex-1 rounded-full transition-all duration-300",
                  s <= step ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
