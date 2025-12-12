import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, Scissors, User, Calendar, ChevronUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Service, Stylist, BookingData } from "@/types/booking";

interface BookingSummaryMobileProps {
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

export const BookingSummaryMobile = ({ 
  bookingData, 
  totalDuration, 
  step,
  onRemoveService 
}: BookingSummaryMobileProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasServices = bookingData.services.length > 0;
  
  if (!hasServices) return null;

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed bottom-0 left-0 right-0 z-[9999]"
      style={{ isolation: 'isolate' }}
    >
      <div className="bg-background border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.15)] rounded-t-2xl">
        {/* Collapsed Header - Always visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Scissors className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">Tu reserva</span>
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {bookingData.services.length} servicio{bookingData.services.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-primary">{totalDuration} min</span>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            </motion.div>
          </div>
        </button>

        {/* Expandable Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3">
                {/* Services List */}
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Servicios
                  </span>
                  {bookingData.services.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        <span className="text-foreground truncate">{service.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-muted-foreground text-xs">{service.duration}min</span>
                        {step === 1 && onRemoveService && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveService(service.id);
                            }}
                            className="p-1 hover:bg-destructive/10 rounded transition-colors"
                          >
                            <X className="h-3.5 w-3.5 text-destructive" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Additional Info */}
                <div className="space-y-2 pt-2 border-t border-border/50">
                  {/* Stylist */}
                  {bookingData.stylist && step >= 2 && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>Peluquera</span>
                      </div>
                      <span className="font-medium text-foreground">
                        {stylistNames[bookingData.stylist]}
                      </span>
                    </div>
                  )}

                  {/* Date & Time */}
                  {bookingData.date && bookingData.time && step >= 3 && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Fecha y hora</span>
                      </div>
                      <span className="font-medium text-foreground">
                        {format(bookingData.date, "d MMM", { locale: es })} - {bookingData.time}
                      </span>
                    </div>
                  )}

                  {/* Total */}
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-border/50">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Duración total</span>
                    </div>
                    <span className="font-semibold text-primary text-base">
                      {totalDuration} min
                    </span>
                  </div>
                </div>

                {/* Progress */}
                <div className="pt-2">
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map((s) => (
                      <div
                        key={s}
                        className={cn(
                          "h-1.5 flex-1 rounded-full transition-all duration-300",
                          s <= step ? "bg-primary" : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Paso {step} de 4
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
