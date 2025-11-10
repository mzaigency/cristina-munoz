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
  isAdmin?: boolean;
}

export const DateTimeSelection = ({
  selectedDate,
  selectedTime,
  totalDuration,
  stylist,
  onNext,
  onBack,
  isAdmin = false,
}: DateTimeSelectionProps) => {
  const [date, setDate] = useState<Date | undefined>(selectedDate || undefined);
  const [time, setTime] = useState<string | null>(selectedTime);
  const [customTime, setCustomTime] = useState<string>("");
  const [bookedRanges, setBookedRanges] = useState<Array<{ start: number; end: number }>>([]);
  const [fusedAvailableSlots, setFusedAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch booked appointments from Google Calendar when date changes
  useEffect(() => {
    if (!date) return;

    const fetchBookedSlots = async () => {
      setLoading(true);
      try {
        // Format date in YYYY-MM-DD format
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        // Special handling for "any" stylist: fetch both stylists and merge availability
        if (stylist === 'any') {
          const [crisResponse, desiResponse] = await Promise.all([
            supabase.functions.invoke('check-availability', {
              body: { date: dateStr, stylist: 'cris', totalDuration: totalDuration },
            }),
            supabase.functions.invoke('check-availability', {
              body: { date: dateStr, stylist: 'desi', totalDuration: totalDuration },
            }),
          ]);

          if (crisResponse.error || desiResponse.error) {
            console.error('Error checking availability:', crisResponse.error || desiResponse.error);
            setBookedRanges([]);
            setFusedAvailableSlots([]);
            return;
          }

          // Helper function to convert booked slots to ranges and calculate available slots
          const calculateAvailableSlots = (bookedData: any): string[] => {
            const ranges: Array<{ start: number; end: number }> = [];
            bookedData?.bookedSlots?.forEach((booking: { Hora: string; total_duration: number }) => {
              const startTime = booking.Hora.substring(0, 5);
              const [hours, minutes] = startTime.split(':').map(Number);
              const startMinutes = hours * 60 + minutes;
              const endMinutes = startMinutes + booking.total_duration;
              ranges.push({ start: startMinutes, end: endMinutes });
            });

            // Use the same logic as getAvailableTimeSlots but with these specific ranges
            const day = date.getDay();
            const isToday = date.toDateString() === new Date().toDateString();
            const currentMinutes = isToday ? new Date().getHours() * 60 + new Date().getMinutes() : 0;
            
            let morningStart = 0, morningEnd = 0, afternoonStart = 0, afternoonEnd = 0;
            if (day >= 2 && day <= 5) {
              morningStart = 9 * 60; morningEnd = 12 * 60 + 30;
              afternoonStart = 15 * 60; afternoonEnd = 19 * 60;
            } else if (day === 6) {
              morningStart = 8 * 60; morningEnd = 13 * 60;
            } else {
              return [];
            }

            const slotsSet = new Set<number>();
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
            
            ranges.forEach(booking => {
              const endTime = booking.end;
              const inMorning = endTime >= morningStart && endTime < morningEnd;
              const inAfternoon = endTime >= afternoonStart && endTime < afternoonEnd;
              if (inMorning || inAfternoon) slotsSet.add(endTime);
            });

            const allSlots = Array.from(slotsSet)
              .sort((a, b) => a - b)
              .map(minutes => {
                const hours = Math.floor(minutes / 60);
                const mins = minutes % 60;
                return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
              });

            const hasOverlap = (start1: number, end1: number, start2: number, end2: number): boolean => {
              return start1 < end2 && start2 < end1;
            };

            return allSlots.filter((slot) => {
              const [hours, minutes] = slot.split(':').map(Number);
              const startMinutes = hours * 60 + minutes;
              const endMinutes = startMinutes + totalDuration;
              
              if (isToday && startMinutes <= currentMinutes) return false;
              
              const inMorning = startMinutes >= morningStart && startMinutes < morningEnd;
              const inAfternoon = startMinutes >= afternoonStart && startMinutes < afternoonEnd;
              
              if (inMorning && endMinutes > morningEnd) return false;
              if (inAfternoon && endMinutes > afternoonEnd) return false;
              
              for (const booking of ranges) {
                if (hasOverlap(startMinutes, endMinutes, booking.start, booking.end)) return false;
              }
              
              return true;
            });
          };

          const crisSlots = calculateAvailableSlots(crisResponse.data);
          const desiSlots = calculateAvailableSlots(desiResponse.data);

          // Merge and deduplicate
          const mergedSlots = [...new Set([...crisSlots, ...desiSlots])].sort();
          
          console.log('Cris available slots:', crisSlots);
          console.log('Desi available slots:', desiSlots);
          console.log('Merged available slots:', mergedSlots);
          
          setFusedAvailableSlots(mergedSlots);
          setBookedRanges([]); // Clear bookedRanges as we're using fused slots
        } else {
          // Regular handling for specific stylist
          const { data, error } = await supabase.functions.invoke('check-availability', {
            body: {
              date: dateStr,
              stylist: stylist,
              totalDuration: totalDuration,
            },
          });

          if (error) {
            console.error('Error checking availability:', error);
            setBookedRanges([]);
            return;
          }

          console.log('Raw data from check-availability:', data);
          console.log('Booked slots received:', data?.bookedSlots);

          const ranges: Array<{ start: number; end: number }> = [];
          data?.bookedSlots?.forEach((booking: { Hora: string; total_duration: number }) => {
            const startTime = booking.Hora.substring(0, 5);
            const [hours, minutes] = startTime.split(':').map(Number);
            const startMinutes = hours * 60 + minutes;
            const endMinutes = startMinutes + booking.total_duration;
            ranges.push({ start: startMinutes, end: endMinutes });
            console.log(`Blocking: ${startTime} (${startMinutes} min) to ${endMinutes} min`);
          });

          console.log('Final bookedRanges:', ranges);
          setBookedRanges(ranges);
          setFusedAvailableSlots([]); // Clear fused slots
        }
      } catch (error) {
        console.error('Error:', error);
        setBookedRanges([]);
        setFusedAvailableSlots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookedSlots();
  }, [date, stylist, totalDuration]);

  // Generate available time slots based on day, duration, and existing bookings
  const getAvailableTimeSlots = (selectedDate: Date | undefined) => {
    if (!selectedDate) return [];

    const day = selectedDate.getDay();
    
    // Check if selected date is today
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();
    const currentMinutes = isToday ? now.getHours() * 60 + now.getMinutes() : 0;
    
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

    // Helper function to check if start time overlaps with any existing booking
    const startsInsideBooking = (startMinutes: number): boolean => {
      for (const booking of bookedRanges) {
        if (startMinutes >= booking.start && startMinutes < booking.end) {
          return true; // Start time is inside an existing booking
        }
      }
      return false;
    };

    // Filter slots: must fit within business hours AND not start during existing bookings
    return allSlots.filter((slot) => {
      const [hours, minutes] = slot.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + totalDuration;
      
      // If it's today, filter out past time slots
      if (isToday && startMinutes <= currentMinutes) {
        return false; // Slot is in the past
      }
      
      // Check if the start time is inside any existing booking (only active parts are blocked)
      if (startsInsideBooking(startMinutes)) {
        return false; // Cannot start during an existing booking
      }
      
      // Check if service would end after closing time (total duration must fit)
      const inMorning = startMinutes >= morningStart && startMinutes < morningEnd;
      const inAfternoon = startMinutes >= afternoonStart && startMinutes < afternoonEnd;
      
      if (inMorning && endMinutes > morningEnd) {
        return false; // Service would extend past morning closing
      }
      
      if (inAfternoon && endMinutes > afternoonEnd) {
        return false; // Service would extend past afternoon closing
      }
      
      return true;
    });
  };

  const timeSlots = stylist === 'any' ? fusedAvailableSlots : getAvailableTimeSlots(date);

  const handleCustomTimeChange = (value: string) => {
    setCustomTime(value);
    // Validate HH:MM format
    const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
    if (timeRegex.test(value)) {
      setTime(value);
    }
  };

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
          ) : (
            <>
              {isAdmin && (
                <div className="mb-4 space-y-2">
                  <label htmlFor="customTime" className="text-sm font-medium text-foreground">
                    Hora personalizada (SIN RESTRICCIONES)
                  </label>
                  <input
                    id="customTime"
                    type="text"
                    value={customTime}
                    onChange={(e) => handleCustomTimeChange(e.target.value)}
                    placeholder="15:10"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Introduce cualquier hora en formato 24h. No hay límites de horario (ej: 07:00, 22:30, etc.)
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
                        variant={time === slot && !customTime ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setTime(slot);
                          setCustomTime("");
                        }}
                        className={cn(
                          time === slot && !customTime && "bg-primary text-primary-foreground"
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
                const [hours, minutes] = time.split(':').map(Number);
                const startMinutes = hours * 60 + minutes;
                const endMinutes = startMinutes + totalDuration;
                const endHours = Math.floor(endMinutes / 60);
                const endMins = endMinutes % 60;
                const endTime = `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`;
                return `Duración estimada: ${totalDuration} minutos (finaliza a las ${endTime})`;
              })()}
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
