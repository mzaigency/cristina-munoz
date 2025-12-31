import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { X, CalendarDays, Clock, Loader2, CheckCircle, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RescheduleFlowProps {
  booking: {
    id: string;
    Fecha: string;
    Hora: string;
    stylist: string;
    services: any[];
    total_duration: number;
    tenant_id?: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export function RescheduleFlow({ booking, onClose, onSuccess }: RescheduleFlowProps) {
  const [step, setStep] = useState<"date" | "time" | "confirm">("date");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch available slots when date changes
  useEffect(() => {
    if (selectedDate && booking.tenant_id) {
      fetchAvailableSlots();
    }
  }, [selectedDate]);

  const fetchAvailableSlots = async () => {
    if (!selectedDate || !booking.tenant_id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-availability', {
        body: {
          tenantId: booking.tenant_id,
          date: format(selectedDate, 'yyyy-MM-dd'),
          stylist: booking.stylist,
          duration: booking.total_duration,
          excludeBookingId: booking.id,
        }
      });

      if (error) throw error;
      setAvailableSlots(data?.slots || generateFallbackSlots());
    } catch (error) {
      console.error('Error fetching slots:', error);
      setAvailableSlots(generateFallbackSlots());
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 20; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 20) slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime(null);
    if (date) setStep("time");
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep("confirm");
  };

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          Fecha: format(selectedDate, 'yyyy-MM-dd'),
          Hora: selectedTime,
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id);

      if (error) throw error;

      toast({
        title: "Cita reagendada",
        description: `Tu cita ha sido movida al ${format(selectedDate, "d 'de' MMMM", { locale: es })} a las ${selectedTime}`,
      });

      onSuccess();
    } catch (error) {
      console.error('Error rescheduling:', error);
      toast({
        title: "Error",
        description: "No se pudo reagendar la cita",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const serviceNames = Array.isArray(booking.services) 
    ? booking.services.map((s: any) => s.name).join(", ")
    : "Servicios";

  return (
    <Drawer open onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="text-lg font-bold text-foreground">Reagendar cita</DrawerTitle>
              <p className="text-sm text-muted-foreground mt-1">{serviceNames}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 mt-4">
            {["date", "time", "confirm"].map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    step === s || (i === 0 && step !== "date") || (i === 1 && step === "confirm")
                      ? "bg-primary"
                      : "bg-secondary"
                  }`}
                />
              </div>
            ))}
          </div>
        </DrawerHeader>

        {/* Content */}
        <div className="overflow-y-auto p-4 pb-8">
          <AnimatePresence mode="wait">
            {step === "date" && (
              <motion.div
                key="date"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3 text-muted-foreground mb-4">
                  <CalendarDays className="h-5 w-5" />
                  <span className="font-medium">Selecciona nueva fecha</span>
                </div>
                
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => date < new Date() || date.getDay() === 0}
                    locale={es}
                    className="rounded-xl border border-border"
                  />
                </div>
              </motion.div>
            )}

            {step === "time" && (
              <motion.div
                key="time"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Clock className="h-5 w-5" />
                    <span className="font-medium">Selecciona hora</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setStep("date")}>
                    Cambiar fecha
                  </Button>
                </div>

                {selectedDate && (
                  <p className="text-sm text-foreground font-medium bg-secondary px-3 py-2 rounded-lg inline-block">
                    {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
                  </p>
                )}

                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map((time) => (
                      <motion.button
                        key={time}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleTimeSelect(time)}
                        className={`py-3 px-2 rounded-xl text-sm font-semibold transition-all ${
                          selectedTime === time
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-foreground hover:bg-secondary/80"
                        }`}
                      >
                        {time}
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {step === "confirm" && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  <span className="font-medium">Confirmar cambio</span>
                </div>

                {/* Change summary */}
                <div className="bg-secondary/50 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Antes</p>
                      <p className="font-semibold text-foreground">
                        {format(new Date(booking.Fecha), "d MMM", { locale: es })} · {booking.Hora}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-primary" />
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Después</p>
                      {selectedDate && selectedTime && (
                        <p className="font-semibold text-primary">
                          {format(selectedDate, "d MMM", { locale: es })} · {selectedTime}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-border pt-3">
                    <p className="text-sm text-muted-foreground">{serviceNames}</p>
                    <p className="text-xs text-muted-foreground mt-1">{booking.total_duration} min</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep("time")}
                    disabled={submitting}
                  >
                    Volver
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleConfirm}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Confirmar"
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
