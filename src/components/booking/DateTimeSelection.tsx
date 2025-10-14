import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Stylist } from "./BookingFlow";
import { supabase } from "@/integrations/supabase/client";

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
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch booked slots when date changes
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
          .select('booking_time, total_duration')
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

        // Calculate all blocked time slots
        const blocked: string[] = [];
        data?.forEach((booking) => {
          const startTime = booking.booking_time.substring(0, 5); // "HH:MM"
          const [hours, minutes] = startTime.split(':').map(Number);
          const startMinutes = hours * 60 + minutes;
          
          // Block all slots during this booking
          for (let i = 0; i < booking.total_duration; i += 30) {
            const slotMinutes = startMinutes + i;
            const slotHours = Math.floor(slotMinutes / 60);
            const slotMins = slotMinutes % 60;
            const slotTime = `${slotHours.toString().padStart(2, '0')}:${slotMins.toString().padStart(2, '0')}`;
            blocked.push(slotTime);
          }
        });

        setBookedSlots(blocked);
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

    const allSlots: string[] = [];

    // Generate morning slots
    if (morningEnd > 0) {
      for (let minutes = morningStart; minutes < morningEnd; minutes += 30) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        allSlots.push(`${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`);
      }
    }

    // Generate afternoon slots
    if (afternoonEnd > 0) {
      for (let minutes = afternoonStart; minutes < afternoonEnd; minutes += 30) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        allSlots.push(`${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`);
      }
    }

    // Filter slots: must have enough consecutive time AND not exceed closing time
    return allSlots.filter((slot) => {
      const [hours, minutes] = slot.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + totalDuration;
      
      // Check if service would end after closing time
      // Determine which period we're in
      const inMorning = startMinutes >= morningStart && startMinutes < morningEnd;
      const inAfternoon = startMinutes >= afternoonStart && startMinutes < afternoonEnd;
      
      if (inMorning && endMinutes > morningEnd) {
        return false; // Service would extend past morning closing
      }
      
      if (inAfternoon && endMinutes > afternoonEnd) {
        return false; // Service would extend past afternoon closing
      }
      
      // Check if all required slots are available (not booked)
      for (let i = 0; i < totalDuration; i += 30) {
        const checkMinutes = startMinutes + i;
        const checkHours = Math.floor(checkMinutes / 60);
        const checkMins = checkMinutes % 60;
        const checkTime = `${checkHours.toString().padStart(2, '0')}:${checkMins.toString().padStart(2, '0')}`;
        
        // If any required slot is booked, this start time is not available
        if (bookedSlots.includes(checkTime)) {
          return false;
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

  // Disable Mondays and Sundays
  const disabledDays = [
    { dayOfWeek: [0, 1] }, // Sunday and Monday
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
