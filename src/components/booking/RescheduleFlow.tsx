import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, Clock, Loader2, CheckCircle, ArrowRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RescheduleFlowProps {
  booking: {
    id: string;
    Fecha: string;
    Hora: string;
    stylist: string;
    services: any[];
    total_duration: number;
    tenant_id?: string;
    tenant_name?: string;
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

  // Generate default time slots
  const generateDefaultSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 20; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 20) slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  // Fetch available slots when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDate]);

  const fetchAvailableSlots = async () => {
    if (!selectedDate) return;
    
    setLoading(true);
    try {
      // If we have tenant_id, try to fetch real availability
      if (booking.tenant_id) {
        const { data, error } = await supabase.functions.invoke('check-availability', {
          body: {
            tenantId: booking.tenant_id,
            date: format(selectedDate, 'yyyy-MM-dd'),
            stylist: booking.stylist,
            duration: booking.total_duration,
            excludeBookingId: booking.id,
          }
        });

        if (!error && data?.slots?.length > 0) {
          setAvailableSlots(data.slots);
          return;
        }
      }
      
      // Fallback to default slots
      setAvailableSlots(generateDefaultSlots());
    } catch (error) {
      console.error('Error fetching slots:', error);
      setAvailableSlots(generateDefaultSlots());
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setSelectedTime(null);
    setStep("time");
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

  const stepTitles = {
    date: "Selecciona fecha",
    time: "Selecciona hora", 
    confirm: "Confirmar cambio"
  };

  return (
    <Drawer open onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b border-border/50 pb-3">
          <div className="flex items-center gap-3">
            {step !== "date" && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full"
                onClick={() => setStep(step === "confirm" ? "time" : "date")}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="flex-1">
              <DrawerTitle className="text-lg font-bold text-foreground">
                {stepTitles[step]}
              </DrawerTitle>
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                {booking.tenant_name || serviceNames}
              </p>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mt-3">
            {["date", "time", "confirm"].map((s, i) => (
              <div
                key={s}
                className={`h-2 w-2 rounded-full transition-colors ${
                  step === s 
                    ? "bg-primary w-6" 
                    : i < ["date", "time", "confirm"].indexOf(step)
                      ? "bg-primary"
                      : "bg-secondary"
                }`}
              />
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
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <CalendarDays className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Nueva fecha</p>
                    <p className="text-sm">Elige cuándo prefieres tu cita</p>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => date < new Date() || date.getDay() === 0}
                    locale={es}
                    className="rounded-xl border border-border"
                    fromDate={new Date()}
                    toDate={addDays(new Date(), 60)}
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
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {selectedDate && format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
                    </p>
                    <p className="text-sm">Selecciona la hora</p>
                  </div>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Cargando horarios...</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map((time) => (
                        <motion.button
                          key={time}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleTimeSelect(time)}
                          className={`py-3 px-3 rounded-xl text-sm font-semibold transition-all ${
                            selectedTime === time
                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                              : "bg-secondary text-foreground hover:bg-secondary/80"
                          }`}
                        >
                          {time}
                        </motion.button>
                      ))}
                    </div>
                  </ScrollArea>
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
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Todo listo</p>
                    <p className="text-sm">Revisa y confirma el cambio</p>
                  </div>
                </div>

                {/* Change summary */}
                <div className="bg-secondary/50 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Fecha actual</p>
                      <p className="font-semibold text-foreground">
                        {format(new Date(booking.Fecha), "EEE, d MMM", { locale: es })}
                      </p>
                      <p className="text-sm text-muted-foreground">{booking.Hora}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-primary flex-shrink-0" />
                    <div className="flex-1 text-right">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Nueva fecha</p>
                      {selectedDate && selectedTime && (
                        <>
                          <p className="font-semibold text-primary">
                            {format(selectedDate, "EEE, d MMM", { locale: es })}
                          </p>
                          <p className="text-sm text-primary">{selectedTime}</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-border pt-3">
                    <p className="text-sm font-medium text-foreground">{serviceNames}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {booking.total_duration} min · {booking.stylist}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep("time")}
                    disabled={submitting}
                  >
                    Cambiar hora
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