import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, User, Calendar, ChevronUp, X, Tag, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Service, Stylist, BookingData, Promotion } from "@/types/booking";
import { Badge } from "@/components/ui/badge";

interface BookingSummaryMobileProps {
  bookingData: BookingData;
  totalDuration: number;
  step: number;
  onRemoveService?: (serviceId: string) => void;
  totalPrice?: number;
  discountedPrice?: number;
}

const stylistNames: Record<Stylist, string> = {
  cris: "Cristina",
  desi: "Desirée",
  any: "Cualquiera",
};

const formatPrice = (price: number): string => `${price.toFixed(2).replace('.', ',')} €`;

/**
 * Barra compacta fija en móvil que resume la reserva en curso.
 * — Se OCULTA en el paso 1 (los servicios ya son visibles en pantalla).
 * — Aparece desde el paso 2. Altura colapsada 52px. Nunca lleva CTA:
 *   el botón "Continuar" vive en cada paso.
 * — Tap → sheet expandible con detalle.
 */
export const BookingSummaryMobile = ({
  bookingData,
  totalDuration,
  step,
  onRemoveService,
  totalPrice = 0,
  discountedPrice,
}: BookingSummaryMobileProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasServices = bookingData.services.length > 0;

  // Paso 1: la lista de servicios ya está a la vista. No duplicamos.
  if (!hasServices || step === 1) return null;

  const hasDiscount = discountedPrice !== undefined && discountedPrice < totalPrice;
  const shownPrice = hasDiscount ? discountedPrice! : totalPrice;

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 60, opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className="fixed bottom-0 left-0 right-0 z-[70] lg:hidden pointer-events-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="pointer-events-auto bg-background/95 backdrop-blur-md border-t border-border/60 shadow-[0_-8px_24px_-8px_rgba(0,0,0,0.12)]">
        {/* Colapsado — 52px altura */}
        <button
          onClick={() => setIsExpanded((v) => !v)}
          className="w-full h-[52px] px-4 flex items-center justify-between active:bg-muted/40 transition-colors"
          aria-expanded={isExpanded}
          aria-label="Ver resumen de la reserva"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[13px] font-semibold text-foreground">Tu reserva</span>
            <span className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full font-medium">
              {bookingData.services.length}
            </span>
            {bookingData.packageId && (
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px] font-medium">
                <Package className="h-2.5 w-2.5 mr-0.5" />
                Pack
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-[11px] text-muted-foreground">{totalDuration} min</span>
            {shownPrice > 0 && (
              <span className={cn("text-[14px] font-bold tabular-nums", hasDiscount ? "text-green-600" : "text-primary")}>
                {formatPrice(shownPrice)}
              </span>
            )}
            <motion.span
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="grid place-items-center"
            >
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            </motion.span>
          </div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3 border-t border-border/40 pt-3">
                {/* Servicios */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Servicios
                  </span>
                  {bookingData.services.map((service) => (
                    <div key={service.id} className="flex items-center justify-between gap-2 text-[13px] py-1">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-1 h-1 rounded-full bg-primary shrink-0" />
                        <span className="text-foreground truncate">{service.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {service.price && service.price > 0 && (
                          <span className="text-[12px] font-medium text-primary tabular-nums">{formatPrice(service.price)}</span>
                        )}
                        <span className="text-muted-foreground text-[11px] tabular-nums">{service.duration}′</span>
                        {step === 1 && onRemoveService && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveService(service.id);
                            }}
                            className="p-1 -m-1 hover:bg-destructive/10 rounded transition-colors"
                            aria-label={`Quitar ${service.name}`}
                          >
                            <X className="h-3.5 w-3.5 text-destructive" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {bookingData.appliedPromotion && (
                  <div className="flex items-center justify-between text-[13px] bg-green-500/10 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Tag className="h-3.5 w-3.5 text-green-600 shrink-0" />
                      <span className="text-green-700 truncate">{bookingData.appliedPromotion.name}</span>
                    </div>
                    <Badge variant="secondary" className="font-mono text-[10px] shrink-0">
                      {bookingData.appliedPromotion.code}
                    </Badge>
                  </div>
                )}

                <div className="space-y-1.5 pt-2 border-t border-border/40 text-[13px]">
                  {bookingData.stylist && step >= 2 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        <span>Profesional</span>
                      </div>
                      <span className="font-medium text-foreground">{stylistNames[bookingData.stylist]}</span>
                    </div>
                  )}

                  {bookingData.date && bookingData.time && step >= 3 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Fecha</span>
                      </div>
                      <span className="font-medium text-foreground">
                        {format(bookingData.date, "d MMM", { locale: es })} · {bookingData.time}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Duración</span>
                    </div>
                    <span className="font-semibold text-foreground tabular-nums">{totalDuration} min</span>
                  </div>

                  {totalPrice > 0 && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-semibold text-foreground">Total</span>
                      <div className="text-right">
                        {hasDiscount ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground line-through text-[12px] tabular-nums">{formatPrice(totalPrice)}</span>
                            <span className="font-bold text-[16px] text-green-600 tabular-nums">{formatPrice(discountedPrice!)}</span>
                          </div>
                        ) : (
                          <span className="font-bold text-[16px] text-primary tabular-nums">{formatPrice(totalPrice)}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
