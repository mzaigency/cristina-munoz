import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Stylist } from "./BookingFlow";
import { supabase } from "@/integrations/supabase/client";
import { es } from "date-fns/locale";

interface DateTimeSelectionProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  totalDuration: number;
  stylist: Stylist;
  onNext: (date: Date, time: string) => void;
  onBack: () => void;
}

export const DateTimeSelection = ({
  selectedDate,
  selectedTime,
  totalDuration,
  stylist,
  onNext,
  onBack,
}: DateTimeSelectionProps) => {
  const [date, setDate] = useState<Date | undefined>(selectedDate || undefined);
  const [time, setTime] = useState<string | null>(selectedTime);
  const [bookedRanges, setBookedRanges] = useState<Array<{ start: number; end: number }>>([]);
  const [loading, setLoading] = useState(false);

  // Fetch booked appointments when date changes
  useEffect(() => {
    if (!date) return;

    const fetchBookedSlots = async () => {
      setLoading(true);
      try {
        // Format date in local timezone (Madrid)
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        // Query bookings for the selected date and stylist
        let query = supabase
          .from('bookings')
          .select('booking_time, total_duration, is_part_of_compound, compound_part')
          .eq('booking_date', dateStr)
          .eq('status', 'confirmed');

        // Filter by stylist unless "any" is selected
        if (stylist !== 'any') {
          query = query.or(`stylist.eq.${stylist},stylist.eq.any`);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching bookings:', error);
          return;
        }

        // Store each booking as a time range (in minutes from midnight)
        const ranges: Array<{ start: number; end: number }> = [];
        data?.forEach((booking) => {
          const startTime = booking.booking_time.substring(0, 5); // "HH:MM"
          const [hours, minutes] = startTime.split(':').map(Number);
          const startMinutes = hours * 60 + minutes;
          const endMinutes = startMinutes + booking.total_duration;
          
          ranges.push({ start: startMinutes, end: endMinutes });
        });

        setBookedRanges(ranges);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookedSlots();
  }, [date, stylist]);

  // Generate available time slots based on day, duration, and existing bookings
  const getAvailableTimeSlots = (selectedDate: Date | undefined) => {
    if (!selectedDate) return [];

    const day = selectedDate.getDay();
    
    // Define business hours for each day
    let morningEnd = 0;
    let afternoonStart = 0;
    let afternoonEnd = 0;
    let morningStart = 0;
    
    if (day >= 2 && day <= 5) { // Tuesday to Friday
      morningStart = 9 * 60; // 9:00
      morningEnd = 12 * 60 + 30; // 12:30
      afternoonStart = 15 * 60; // 15:00
      afternoonEnd = 19 * 60; // 19:00
    } else if (day === 6) { // Saturday
      morningStart = 8 * 60; // 8:00
      morningEnd = 13 * 60; // 13:00
    } else {
      return []; // Closed on Sunday and Monday
    }

    const slotsSet = new Set<number>();

    // Generate base slots every 30 minutes
    if (morningEnd > 0) {
      for (let minutes = morningStart; minutes < morningEnd; minutes += 30) {
        slotsSet.add(minutes);
      }
    }

    if (afternoonEnd > 0) {
      for (let minutes = afternoonStart; minutes < afternoonEnd; minutes += 30) {
        slotsSet.add(minutes);
      }
    }

    // Add flexible slots right after each existing booking ends
    bookedRanges.forEach(booking => {
      const endTime = booking.end;
      // Only add if within business hours
      const inMorning = endTime >= morningStart && endTime < morningEnd;
      const inAfternoon = endTime >= afternoonStart && endTime < afternoonEnd;
      
      if (inMorning || inAfternoon) {
        slotsSet.add(endTime);
      }
    });

    // Convert to array and sort
    const allSlots = Array.from(slotsSet)
      .sort((a, b) => a - b)
      .map(minutes => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
      });

    // Helper function to check if two time ranges overlap
    const hasOverlap = (start1: number, end1: number, start2: number, end2: number): boolean => {
      return start1 < end2 && start2 < end1;
    };

    // Filter slots: must fit within business hours AND not overlap with existing bookings
    return allSlots.filter((slot) => {
      const [hours, minutes] = slot.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + totalDuration;
      
      // Check if service would end after closing time
      const inMorning = startMinutes >= morningStart && startMinutes < morningEnd;
      const inAfternoon = startMinutes >= afternoonStart && startMinutes < afternoonEnd;
      
      if (inMorning && endMinutes > morningEnd) {
        return false; // Service would extend past morning closing
      }
      
      if (inAfternoon && endMinutes > afternoonEnd) {
        return false; // Service would extend past afternoon closing
      }
      
      // Check if this time slot overlaps with any existing booking
      for (const booking of bookedRanges) {
        if (hasOverlap(startMinutes, endMinutes, booking.start, booking.end)) {
          return false; // This slot would overlap with an existing booking
        }
      }
      
      return true;
    });
  };

  const timeSlots = getAvailableTimeSlots(date);

  const handleNext = () => {
    if (date && time) {
      onNext(date, time);
    }
  };

  // Disable Mondays, Sundays, and past dates
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day
  
  const disabledDays = [
    { dayOfWeek: [0, 1] }, // Sunday and Monday
    { before: today }, // Past dates
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
          ) : timeSlots.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay horarios disponibles para este día. Todos los slots están reservados.
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
                    time === slot && "bg-primary text-primary-foreground"
                  )}
                >
                  {slot}
                </Button>
              ))}
            </div>
          )}
          {date && timeSlots.length > 0 && (
            <p className="mt-4 text-xs text-muted-foreground">
              Duración estimada: {totalDuration} minutos
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Volver
        </Button>
        <Button onClick={handleNext} disabled={!date || !time}>
          Continuar
        </Button>
      </div>
    </div>
  );
};
