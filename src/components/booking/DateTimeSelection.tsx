import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { es } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stylist, Service, TimeRange } from "@/types/booking";
import { 
  hasOverlap, 
  getActiveWindows, 
  calculateAvailableSlots,
  formatDateToISO,
  timeStringToMinutes,
  minutesToTimeString 
} from "@/lib/booking-utils";

interface DateTimeSelectionProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  totalDuration: number;
  services: Service[];
  stylist: Stylist;
  onNext: (date: Date, time: string, resolvedStylist?: Stylist, skipAvailabilityCheck?: boolean) => void;
  onBack: () => void;
  isAdmin?: boolean;
}

/** Convierte los slots reservados de la API a rangos de tiempo */
function parseBookedSlotsToRanges(bookedSlots: Array<{ Hora: string; total_duration: number }>): TimeRange[] {
  return bookedSlots.map(booking => {
    const startMinutes = timeStringToMinutes(booking.Hora.substring(0, 5));
    return { 
      start: startMinutes, 
      end: startMinutes + booking.total_duration 
    };
  });
}

/** Calcula slots disponibles para un estilista específico dado los datos de reservas */
function computeAvailableSlotsForStylist(
  date: Date,
  bookedData: { bookedSlots?: Array<{ Hora: string; total_duration: number }> },
  services: Service[],
  totalDuration: number
): string[] {
  const ranges = parseBookedSlotsToRanges(bookedData?.bookedSlots || []);
  return calculateAvailableSlots(date, ranges, services, totalDuration);
}

export const DateTimeSelection = ({
  selectedDate,
  selectedTime,
  totalDuration,
  services,
  stylist,
  onNext,
  onBack,
  isAdmin = false,
}: DateTimeSelectionProps) => {
  const [date, setDate] = useState<Date | undefined>(selectedDate || undefined);
  const [time, setTime] = useState<string | null>(selectedTime);
  const [customHour, setCustomHour] = useState<string>("");
  const [customMinute, setCustomMinute] = useState<string>("");
  const [bookedRanges, setBookedRanges] = useState<TimeRange[]>([]);
  const [fusedAvailableSlots, setFusedAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch booked appointments when date changes
  useEffect(() => {
    if (!date) return;

    const fetchBookedSlots = async () => {
      setLoading(true);
      try {
        const dateStr = formatDateToISO(date);
        
        if (stylist === 'any') {
          // Fetch both stylists and merge availability
          const [crisResponse, desiResponse] = await Promise.all([
            supabase.functions.invoke('check-availability', {
              body: { date: dateStr, stylist: 'cris', totalDuration },
            }),
            supabase.functions.invoke('check-availability', {
              body: { date: dateStr, stylist: 'desi', totalDuration },
            }),
          ]);

          if (crisResponse.error || desiResponse.error) {
            setBookedRanges([]);
            setFusedAvailableSlots([]);
            return;
          }

          const crisSlots = computeAvailableSlotsForStylist(date, crisResponse.data, services, totalDuration);
          const desiSlots = computeAvailableSlotsForStylist(date, desiResponse.data, services, totalDuration);
          const mergedSlots = [...new Set([...crisSlots, ...desiSlots])].sort();
          
          setFusedAvailableSlots(mergedSlots);
          setBookedRanges([]);
        } else {
          // Regular handling for specific stylist
          const { data, error } = await supabase.functions.invoke('check-availability', {
            body: { date: dateStr, stylist, totalDuration },
          });

          if (error) {
            setBookedRanges([]);
            return;
          }

          const ranges = parseBookedSlotsToRanges(data?.bookedSlots || []);
          setBookedRanges(ranges);
          setFusedAvailableSlots([]);
        }
      } catch {
        setBookedRanges([]);
        setFusedAvailableSlots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookedSlots();
  }, [date, stylist, totalDuration, services]);

  // Generate available time slots for specific stylist
  const getAvailableTimeSlots = (selectedDate: Date | undefined): string[] => {
    if (!selectedDate) return [];
    return calculateAvailableSlots(selectedDate, bookedRanges, services, totalDuration);
  };

  const timeSlots = stylist === 'any' ? fusedAvailableSlots : getAvailableTimeSlots(date);

  // Update time when custom hour or minute changes
  useEffect(() => {
    if (customHour && customMinute) {
      const formattedTime = `${customHour.padStart(2, '0')}:${customMinute.padStart(2, '0')}`;
      setTime(formattedTime);
    }
  }, [customHour, customMinute]);

  const handleNext = async () => {
    if (!date || !time) return;

    // In admin mode with custom time, skip availability checks
    if (isAdmin && (customHour || customMinute)) {
      onNext(date, time, stylist === 'any' ? 'cris' : stylist, true);
      return;
    }

    // If stylist is 'any', determine which specific stylist is available
    if (stylist === 'any') {
      try {
        const dateStr = formatDateToISO(date);
        const selectedStartMinutes = timeStringToMinutes(time);
        const activeWindows = getActiveWindows(selectedStartMinutes, services);

        const [crisResponse, desiResponse] = await Promise.all([
          supabase.functions.invoke('check-availability', {
            body: { date: dateStr, stylist: 'cris' },
          }),
          supabase.functions.invoke('check-availability', {
            body: { date: dateStr, stylist: 'desi' },
          }),
        ]);

        const checkStylistAvailability = (bookedData: any): boolean => {
          const ranges = parseBookedSlotsToRanges(bookedData?.bookedSlots || []);
          for (const window of activeWindows) {
            for (const booking of ranges) {
              if (hasOverlap(window.start, window.end, booking.start, booking.end)) {
                return false;
              }
            }
          }
          return true;
        };

        const crisAvailable = crisResponse.data && checkStylistAvailability(crisResponse.data);
        const desiAvailable = desiResponse.data && checkStylistAvailability(desiResponse.data);

        // Determine which stylist to assign
        let assignedStylist: Stylist;
        if (crisAvailable && desiAvailable) {
          assignedStylist = 'cris';
        } else if (crisAvailable) {
          assignedStylist = 'cris';
        } else if (desiAvailable) {
          assignedStylist = 'desi';
        } else {
          return;
        }

        onNext(date, time, assignedStylist);
      } catch {
        return;
      }
    } else {
      onNext(date, time);
    }
  };

  // Disable Mondays, Sundays, and past dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const disabledDays = [
    { dayOfWeek: [0, 1] },
    { before: today },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="mb-4 font-semibold text-foreground">Selecciona una fecha</h3>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={disabledDays}
            weekStartsOn={1}
            locale={es}
            className={cn("rounded-md border pointer-events-auto")}
          />
        </div>

        <div>
          <h3 className="mb-4 font-semibold text-foreground">Selecciona una hora</h3>
          {!date ? (
            <p className="text-sm text-muted-foreground">
              Primero selecciona una fecha
            </p>
          ) : loading ? (
            <p className="text-sm text-muted-foreground">
              Cargando horarios disponibles...
            </p>
          ) : (
            <>
              {isAdmin && (
                <div className="mb-4 space-y-3 p-4 bg-accent/20 rounded-lg border border-accent">
                  <label className="text-sm font-medium text-foreground">
                    Hora personalizada (SIN RESTRICCIONES)
                  </label>
                  <div className="flex gap-2 items-center">
                    <Select value={customHour} onValueChange={setCustomHour}>
                      <SelectTrigger className="w-[100px] transition-colors duration-200 hover:border-primary">
                        <SelectValue placeholder="Hora" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(hour => (
                          <SelectItem key={hour} value={hour}>
                            {hour}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-lg font-semibold">:</span>
                    <Select value={customMinute} onValueChange={setCustomMinute}>
                      <SelectTrigger className="w-[100px] transition-colors duration-200 hover:border-primary">
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent>
                        {['00', '15', '30', '45'].map(minute => (
                          <SelectItem key={minute} value={minute}>
                            {minute}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Selecciona cualquier hora. Esta opción permite agendar fuera de horarios predefinidos.
                  </p>
                </div>
              )}
              
              {timeSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {isAdmin 
                    ? "No hay horarios predefinidos disponibles. Puedes usar el campo de hora personalizada arriba."
                    : "No hay horarios disponibles para este día. Todos los slots están reservados."}
                </p>
              ) : (
                <>
                  {isAdmin && <p className="text-sm text-muted-foreground mb-2">O selecciona un horario disponible:</p>}
                  <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
                    {timeSlots.map((slot) => (
                      <Button
                        key={slot}
                        variant={time === slot && !customHour && !customMinute ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setTime(slot);
                          setCustomHour("");
                          setCustomMinute("");
                        }}
                        className={cn(
                          "transition-all duration-200 hover:shadow-md",
                          time === slot && !customHour && !customMinute && "shadow-glow"
                        )}
                      >
                        {slot}
                      </Button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
          {date && time && (
            <p className="mt-4 text-xs text-muted-foreground">
              {(() => {
                const startMinutes = timeStringToMinutes(time);
                const endMinutes = startMinutes + totalDuration;
                const endTime = minutesToTimeString(endMinutes);
                return `Duración estimada: ${totalDuration} minutos (finaliza a las ${endTime})`;
              })()}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} className="transition-transform duration-200 hover:scale-105">
          Volver
        </Button>
        <Button 
          onClick={handleNext} 
          disabled={!date || !time}
          className="transition-transform duration-200 hover:scale-105 disabled:scale-100"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};
