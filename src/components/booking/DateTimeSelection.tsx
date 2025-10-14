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
          // booking_time viene en formato "HH:MM:SS" desde la base de datos
          const startTime = booking.booking_time; // Mantener el formato original
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
    const allSlots: string[] = [];

    // Tuesday to Friday: 9:00-12:30 and 15:00-19:00
    if (day >= 2 && day <= 5) {
      // Morning slots (9:00 - 12:30)
      for (let hour = 9; hour < 12; hour++) {
        allSlots.push(`${hour.toString().padStart(2, "0")}:00`);
        allSlots.push(`${hour.toString().padStart(2, "0")}:30`);
      }
      allSlots.push("12:00");
      
      // Afternoon slots (15:00 - 19:00)
      for (let hour = 15; hour < 19; hour++) {
        allSlots.push(`${hour.toString().padStart(2, "0")}:00`);
        allSlots.push(`${hour.toString().padStart(2, "0")}:30`);
      }
    }
    // Saturday: 8:00-13:00
    else if (day === 6) {
      for (let hour = 8; hour < 13; hour++) {
        allSlots.push(`${hour.toString().padStart(2, "0")}:00`);
        allSlots.push(`${hour.toString().padStart(2, "0")}:30`);
      }
    }

    // Filter out slots that don't have enough consecutive time available
    return allSlots.filter((slot) => {
      // Check if this slot and all needed consecutive slots are available
      const [hours, minutes] = slot.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      
      for (let i = 0; i < totalDuration; i += 30) {
        const checkMinutes = startMinutes + i;
        const checkHours = Math.floor(checkMinutes / 60);
        const checkMins = checkMinutes % 60;
        const checkTime = `${checkHours.toString().padStart(2, '0')}:${checkMins.toString().padStart(2, '0')}`;
        
        // If any required slot is booked, this start time is not available
        if (bookedSlots.includes(checkTime)) {
          return false;
        }
        
        // Also check if the slot exists in business hours
        if (!allSlots.includes(checkTime)) {
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
