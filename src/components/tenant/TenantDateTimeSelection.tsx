import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { es } from "date-fns/locale";
import { Service, TimeRange } from "@/types/booking";
import { useTenantBusinessHours } from "@/hooks/useTenantBusinessHours";
import { Loader2 } from "lucide-react";

interface TenantStylist {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

interface TenantDateTimeSelectionProps {
  tenantId: string;
  selectedDate: Date | null;
  selectedTime: string | null;
  totalDuration: number;
  services: Service[];
  stylist: string; // stylist slug or "any"
  onNext: (date: Date, time: string, resolvedStylist?: string) => void;
  onBack: () => void;
}

// Utility functions
function timeStringToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function formatDateToISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function hasOverlap(start1: number, end1: number, start2: number, end2: number): boolean {
  return start1 < end2 && start2 < end1;
}

function getActiveWindows(startMin: number, services: Service[]): TimeRange[] {
  const windows: TimeRange[] = [];
  let currentTime = startMin;

  for (const service of services) {
    if (service.type === 'Compuesto') {
      windows.push({ start: currentTime, end: currentTime + service.duration_part1_active });
      currentTime += service.duration_part1_active + service.duration_exposure_pause;
      windows.push({ start: currentTime, end: currentTime + service.duration_part2_active });
      currentTime += service.duration_part2_active;
    } else {
      windows.push({ start: currentTime, end: currentTime + service.duration });
      currentTime += service.duration;
    }
  }

  return windows;
}

function parseBookedSlotsToRanges(bookedSlots: Array<{ Hora: string; total_duration: number }>): TimeRange[] {
  return bookedSlots.map(booking => {
    const startMinutes = timeStringToMinutes(booking.Hora.substring(0, 5));
    return { start: startMinutes, end: startMinutes + booking.total_duration };
  });
}

export const TenantDateTimeSelection = ({
  tenantId,
  selectedDate,
  selectedTime,
  totalDuration,
  services,
  stylist,
  onNext,
  onBack,
}: TenantDateTimeSelectionProps) => {
  const [date, setDate] = useState<Date | undefined>(selectedDate || undefined);
  const [time, setTime] = useState<string | null>(selectedTime);
  const [stylists, setStylists] = useState<TenantStylist[]>([]);
  const [bookedRanges, setBookedRanges] = useState<TimeRange[]>([]);
  const [fusedAvailableSlots, setFusedAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [stylistsLoading, setStylistsLoading] = useState(true);

  const { businessHours, loading: hoursLoading, generateBaseSlots, getBusinessHoursForDay, getClosedDays } = useTenantBusinessHours(tenantId);

  // Fetch tenant stylists
  useEffect(() => {
    const fetchStylists = async () => {
      try {
        const { data, error } = await supabase
          .from("tenant_stylists")
          .select("id, name, slug, color")
          .eq("tenant_id", tenantId)
          .eq("is_active", true)
          .order("name", { ascending: true });

        if (error) throw error;
        setStylists(data || []);
      } catch (error) {
        console.error("Error fetching stylists:", error);
      } finally {
        setStylistsLoading(false);
      }
    };

    if (tenantId) {
      fetchStylists();
    }
  }, [tenantId]);

  // Calculate available slots for a specific stylist
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

    // Generate base slots
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
    if (!date || stylistsLoading || hoursLoading) return;

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
          responses.forEach((response, index) => {
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
  }, [date, stylist, totalDuration, services, stylists, stylistsLoading, hoursLoading, tenantId]);

  // Generate available time slots for specific stylist
  const getAvailableTimeSlots = (selectedDate: Date | undefined): string[] => {
    if (!selectedDate) return [];
    
    const dayOfWeek = selectedDate.getDay();
    const hours = getBusinessHoursForDay(dayOfWeek);

    if (hours.isClosed) return [];

    const isToday = selectedDate.toDateString() === new Date().toDateString();
    const currentMinutes = isToday ? new Date().getHours() * 60 + new Date().getMinutes() : 0;

    // Generate base slots
    const slotsSet = generateBaseSlots(dayOfWeek);

    // Add flexible slots after bookings
    bookedRanges.forEach(booking => {
      const endTime = booking.end;
      const inMorning = endTime >= hours.morningStart && endTime < hours.morningEnd;
      const inAfternoon = endTime >= hours.afternoonStart && endTime < hours.afternoonEnd;
      if (inMorning || inAfternoon) {
        slotsSet.add(endTime);
      }
    });

    const allSlots = Array.from(slotsSet).sort((a, b) => a - b).map(minutesToTimeString);

    return allSlots.filter(slot => {
      const startMinutes = timeStringToMinutes(slot);
      const endMinutes = startMinutes + totalDuration;

      if (isToday && startMinutes <= currentMinutes) return false;

      const inMorning = startMinutes >= hours.morningStart && startMinutes < hours.morningEnd;
      const inAfternoon = startMinutes >= hours.afternoonStart && startMinutes < hours.afternoonEnd;

      if (inMorning && endMinutes > hours.morningEnd) return false;
      if (inAfternoon && endMinutes > hours.afternoonEnd) return false;

      const activeWindows = getActiveWindows(startMinutes, services);
      for (const window of activeWindows) {
        for (const booking of bookedRanges) {
          if (hasOverlap(window.start, window.end, booking.start, booking.end)) {
            return false;
          }
        }
      }

      return true;
    });
  };

  const timeSlots = stylist === 'any' ? fusedAvailableSlots : getAvailableTimeSlots(date);

  const handleNext = async () => {
    if (!date || !time) return;

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
          onNext(date, time, availableStylist.slug);
        }
      } catch {
        return;
      }
    } else {
      onNext(date, time);
    }
  };

  // Get closed days for calendar disabling
  const closedDays = getClosedDays();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const disabledDays = [
    { dayOfWeek: closedDays },
    { before: today },
  ];

  if (stylistsLoading || hoursLoading) {
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
          ) : timeSlots.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay horarios disponibles para este día. Intenta con otra fecha.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
              {timeSlots.map((slot) => (
                <Button
                  key={slot}
                  variant={time === slot ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTime(slot)}
                  className={cn(
                    "transition-all duration-200 hover:shadow-md",
                    time === slot && "shadow-glow"
                  )}
                >
                  {slot}
                </Button>
              ))}
            </div>
          )}
          {date && time && (
            <p className="mt-4 text-xs text-muted-foreground">
              Duración estimada: {totalDuration} minutos (finaliza a las {minutesToTimeString(timeStringToMinutes(time) + totalDuration)})
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

export default TenantDateTimeSelection;
