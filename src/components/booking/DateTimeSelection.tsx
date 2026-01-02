import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { es } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stylist, Service, TimeRange } from "@/types/booking";
import { useTenantBusinessHours } from "@/hooks/useTenantBusinessHours";
import { Loader2 } from "lucide-react";
import { 
  hasOverlap, 
  getActiveWindows, 
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
  tenantId?: string;
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

export const DateTimeSelection = ({
  selectedDate,
  selectedTime,
  totalDuration,
  services,
  stylist,
  tenantId,
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
  const [stylists, setStylists] = useState<Array<{ slug: string; id: string }>>([]);

  // Use tenant business hours
  const { 
    loading: hoursLoading, 
    generateBaseSlots, 
    getBusinessHoursForDay, 
    getClosedDays 
  } = useTenantBusinessHours(tenantId || '');

  // Fetch tenant stylists
  useEffect(() => {
    if (!tenantId) return;
    
    const fetchStylists = async () => {
      const { data } = await supabase
        .from("tenant_stylists")
        .select("id, slug")
        .eq("tenant_id", tenantId)
        .eq("is_active", true);
      
      setStylists(data || []);
    };
    
    fetchStylists();
  }, [tenantId]);

  // Calculate available slots using tenant business hours
  const computeAvailableSlotsForStylist = (
    selectedDate: Date,
    bookedData: { bookedSlots?: Array<{ Hora: string; total_duration: number }> }
  ): string[] => {
    const ranges = parseBookedSlotsToRanges(bookedData?.bookedSlots || []);
    const dayOfWeek = selectedDate.getDay();
    const hours = getBusinessHoursForDay(dayOfWeek);

    if (hours.isClosed) return [];

    const isToday = selectedDate.toDateString() === new Date().toDateString();
    const currentMinutes = isToday ? new Date().getHours() * 60 + new Date().getMinutes() : 0;

    // Generate base slots from tenant hours
    const slotsSet = generateBaseSlots(dayOfWeek);

    // Add flexible slots after existing bookings
    ranges.forEach(booking => {
      const endTime = booking.end;
      const inMorning = endTime >= hours.morningStart && endTime < hours.morningEnd;
      const inAfternoon = endTime >= hours.afternoonStart && endTime < hours.afternoonEnd;
      if (inMorning || inAfternoon) {
        slotsSet.add(endTime);
      }
    });

    // Convert to sorted array
    const allSlots = Array.from(slotsSet).sort((a, b) => a - b).map(minutesToTimeString);

    // Filter available slots
    return allSlots.filter(slot => {
      const startMinutes = timeStringToMinutes(slot);
      const endMinutes = startMinutes + totalDuration;

      if (isToday && startMinutes <= currentMinutes) return false;

      const inMorning = startMinutes >= hours.morningStart && startMinutes < hours.morningEnd;
      const inAfternoon = startMinutes >= hours.afternoonStart && startMinutes < hours.afternoonEnd;

      if (inMorning && endMinutes > hours.morningEnd) return false;
      if (inAfternoon && endMinutes > hours.afternoonEnd) return false;

      // Check overlap with bookings
      const activeWindows = getActiveWindows(startMinutes, services);
      for (const window of activeWindows) {
        for (const booking of ranges) {
          if (hasOverlap(window.start, window.end, booking.start, booking.end)) {
            return false;
          }
        }
      }

      return true;
    });
  };

  // Fetch booked appointments when date changes
  useEffect(() => {
    if (!date || hoursLoading) return;

    const fetchBookedSlots = async () => {
      setLoading(true);
      try {
        const dateStr = formatDateToISO(date);
        
        if (stylist === 'any' && stylists.length > 0) {
          // Fetch all stylists and merge availability
          const responses = await Promise.all(
            stylists.map(s => 
              supabase.functions.invoke('check-availability', {
                body: { date: dateStr, stylist: s.slug, totalDuration, tenant_id: tenantId },
              })
            )
          );

          // Merge all available slots
          const allSlotsSet = new Set<string>();
          responses.forEach((response) => {
            if (!response.error && response.data) {
              const slots = computeAvailableSlotsForStylist(date, response.data);
              slots.forEach(slot => allSlotsSet.add(slot));
            }
          });

          const mergedSlots = Array.from(allSlotsSet).sort();
          setFusedAvailableSlots(mergedSlots);
          setBookedRanges([]);
        } else {
          // Regular handling for specific stylist
          const { data, error } = await supabase.functions.invoke('check-availability', {
            body: { date: dateStr, stylist, totalDuration, tenant_id: tenantId },
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
  }, [date, stylist, totalDuration, services, stylists, hoursLoading, tenantId]);

  // Generate available time slots for specific stylist
  const getAvailableTimeSlots = (selectedDate: Date | undefined): string[] => {
    if (!selectedDate) return [];
    return computeAvailableSlotsForStylist(selectedDate, { bookedSlots: bookedRanges.map(r => ({
      Hora: minutesToTimeString(r.start) + ':00',
      total_duration: r.end - r.start
    }))});
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
      // For 'any' stylist, pick the first available
      const defaultStylist = stylists.length > 0 ? stylists[0].slug : 'cris';
      onNext(date, time, (stylist === 'any' ? defaultStylist : stylist) as Stylist, true);
      return;
    }

    // If stylist is 'any', determine which specific stylist is available
    if (stylist === 'any' && stylists.length > 0) {
      try {
        const dateStr = formatDateToISO(date);
        const selectedStartMinutes = timeStringToMinutes(time);
        const activeWindows = getActiveWindows(selectedStartMinutes, services);

        // Check each stylist's availability
        const availabilityResults = await Promise.all(
          stylists.map(async (s) => {
            const { data, error } = await supabase.functions.invoke('check-availability', {
              body: { date: dateStr, stylist: s.slug, tenant_id: tenantId },
            });

            if (error) return { slug: s.slug, available: false };

            const ranges = parseBookedSlotsToRanges(data?.bookedSlots || []);
            const isAvailable = !activeWindows.some(window => 
              ranges.some(booking => hasOverlap(window.start, window.end, booking.start, booking.end))
            );

            return { slug: s.slug, available: isAvailable };
          })
        );

        // Find first available stylist
        const availableStylist = availabilityResults.find(r => r.available);
        if (availableStylist) {
          onNext(date, time, availableStylist.slug as Stylist);
        }
      } catch {
        return;
      }
    } else {
      onNext(date, time);
    }
  };

  // Get closed days from tenant business hours
  const closedDays = getClosedDays();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const disabledDays = [
    { dayOfWeek: closedDays },
    { before: today },
  ];

  if (hoursLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando horarios disponibles...
            </div>
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
