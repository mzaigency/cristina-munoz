import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Stylist } from "./BookingFlow";
import { supabase } from "@/integrations/supabase/client";
import { es } from "date-fns/locale";

interface CompoundDateTimeSelectionProps {
  selectedDatePart1: Date | null;
  selectedTimePart1: string | null;
  selectedDatePart2: Date | null;
  selectedTimePart2: string | null;
  durationPart1: number;
  durationPart2: number;
  stylist: Stylist;
  onNext: (datePart1: Date, timePart1: string, datePart2: Date, timePart2: string) => void;
  onBack: () => void;
}

export const CompoundDateTimeSelection = ({
  selectedDatePart1,
  selectedTimePart1,
  selectedDatePart2,
  selectedTimePart2,
  durationPart1,
  durationPart2,
  stylist,
  onNext,
  onBack,
}: CompoundDateTimeSelectionProps) => {
  const [datePart1, setDatePart1] = useState<Date | undefined>(selectedDatePart1 || undefined);
  const [timePart1, setTimePart1] = useState<string | null>(selectedTimePart1);
  const [datePart2, setDatePart2] = useState<Date | undefined>(selectedDatePart2 || undefined);
  const [timePart2, setTimePart2] = useState<string | null>(selectedTimePart2);
  
  const [bookedRangesPart1, setBookedRangesPart1] = useState<Array<{ start: number; end: number }>>([]);
  const [bookedRangesPart2, setBookedRangesPart2] = useState<Array<{ start: number; end: number }>>([]);
  const [loadingPart1, setLoadingPart1] = useState(false);
  const [loadingPart2, setLoadingPart2] = useState(false);

  // Fetch availability for Part 1
  useEffect(() => {
    if (!datePart1) return;

    const fetchBookedSlots = async () => {
      setLoadingPart1(true);
      try {
        const dateStr = `${datePart1.getFullYear()}-${String(datePart1.getMonth() + 1).padStart(2, '0')}-${String(datePart1.getDate()).padStart(2, '0')}`;
        
        const { data, error } = await supabase.functions.invoke('check-availability', {
          body: {
            date: dateStr,
            stylist: stylist,
            totalDuration: durationPart1,
          },
        });

        if (error) {
          console.error('Error checking availability:', error);
          setBookedRangesPart1([]);
          return;
        }

        const ranges: Array<{ start: number; end: number }> = [];
        data?.bookedSlots?.forEach((booking: { Hora: string; total_duration: number }) => {
          const startTime = booking.Hora.substring(0, 5);
          const [hours, minutes] = startTime.split(':').map(Number);
          const startMinutes = hours * 60 + minutes;
          const endMinutes = startMinutes + booking.total_duration;
          ranges.push({ start: startMinutes, end: endMinutes });
        });

        setBookedRangesPart1(ranges);
      } catch (error) {
        console.error('Error:', error);
        setBookedRangesPart1([]);
      } finally {
        setLoadingPart1(false);
      }
    };

    fetchBookedSlots();
  }, [datePart1, stylist]);

  // Fetch availability for Part 2
  useEffect(() => {
    if (!datePart2) return;

    const fetchBookedSlots = async () => {
      setLoadingPart2(true);
      try {
        const dateStr = `${datePart2.getFullYear()}-${String(datePart2.getMonth() + 1).padStart(2, '0')}-${String(datePart2.getDate()).padStart(2, '0')}`;
        
        const { data, error } = await supabase.functions.invoke('check-availability', {
          body: {
            date: dateStr,
            stylist: stylist,
            totalDuration: durationPart2,
          },
        });

        if (error) {
          console.error('Error checking availability:', error);
          setBookedRangesPart2([]);
          return;
        }

        const ranges: Array<{ start: number; end: number }> = [];
        data?.bookedSlots?.forEach((booking: { Hora: string; total_duration: number }) => {
          const startTime = booking.Hora.substring(0, 5);
          const [hours, minutes] = startTime.split(':').map(Number);
          const startMinutes = hours * 60 + minutes;
          const endMinutes = startMinutes + booking.total_duration;
          ranges.push({ start: startMinutes, end: endMinutes });
        });

        setBookedRangesPart2(ranges);
      } catch (error) {
        console.error('Error:', error);
        setBookedRangesPart2([]);
      } finally {
        setLoadingPart2(false);
      }
    };

    fetchBookedSlots();
  }, [datePart2, stylist]);

  const getAvailableTimeSlots = (selectedDate: Date | undefined, duration: number, bookedRanges: Array<{ start: number; end: number }>) => {
    if (!selectedDate) return [];

    const day = selectedDate.getDay();
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();
    const currentMinutes = isToday ? now.getHours() * 60 + now.getMinutes() : 0;
    
    let morningEnd = 0;
    let afternoonStart = 0;
    let afternoonEnd = 0;
    let morningStart = 0;
    
    if (day >= 2 && day <= 5) {
      morningStart = 9 * 60;
      morningEnd = 12 * 60 + 30;
      afternoonStart = 15 * 60;
      afternoonEnd = 19 * 60;
    } else if (day === 6) {
      morningStart = 8 * 60;
      morningEnd = 13 * 60;
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

    bookedRanges.forEach(booking => {
      const endTime = booking.end;
      const inMorning = endTime >= morningStart && endTime < morningEnd;
      const inAfternoon = endTime >= afternoonStart && endTime < afternoonEnd;
      
      if (inMorning || inAfternoon) {
        slotsSet.add(endTime);
      }
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
      const endMinutes = startMinutes + duration;
      
      if (isToday && startMinutes <= currentMinutes) {
        return false;
      }
      
      const inMorning = startMinutes >= morningStart && startMinutes < morningEnd;
      const inAfternoon = startMinutes >= afternoonStart && startMinutes < afternoonEnd;
      
      if (inMorning && endMinutes > morningEnd) {
        return false;
      }
      
      if (inAfternoon && endMinutes > afternoonEnd) {
        return false;
      }
      
      for (const booking of bookedRanges) {
        if (hasOverlap(startMinutes, endMinutes, booking.start, booking.end)) {
          return false;
        }
      }
      
      return true;
    });
  };

  const timeSlotsPart1 = getAvailableTimeSlots(datePart1, durationPart1, bookedRangesPart1);
  const timeSlotsPart2 = getAvailableTimeSlots(datePart2, durationPart2, bookedRangesPart2);

  const handleNext = () => {
    if (datePart1 && timePart1 && datePart2 && timePart2) {
      onNext(datePart1, timePart1, datePart2, timePart2);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const disabledDays = [
    { dayOfWeek: [0, 1] },
    { before: today },
  ];

  return (
    <div className="space-y-6">
      <div className="p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          Este servicio requiere dos partes. Selecciona fecha y hora para cada una.
        </p>
      </div>

      {/* Part 1 Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Parte 1 - Aplicación</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h4 className="mb-4 font-medium text-foreground">Selecciona fecha</h4>
            <Calendar
              mode="single"
              selected={datePart1}
              onSelect={setDatePart1}
              disabled={disabledDays}
              weekStartsOn={1}
              locale={es}
              className={cn("rounded-md border pointer-events-auto")}
            />
          </div>

          <div>
            <h4 className="mb-4 font-medium text-foreground">Selecciona hora</h4>
            {!datePart1 ? (
              <p className="text-sm text-muted-foreground">
                Primero selecciona una fecha
              </p>
            ) : loadingPart1 ? (
              <p className="text-sm text-muted-foreground">
                Cargando horarios disponibles...
              </p>
            ) : timeSlotsPart1.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay horarios disponibles para este día.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
                {timeSlotsPart1.map((slot) => (
                  <Button
                    key={slot}
                    variant={timePart1 === slot ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimePart1(slot)}
                    className={cn(
                      timePart1 === slot && "bg-primary text-primary-foreground"
                    )}
                  >
                    {slot}
                  </Button>
                ))}
              </div>
            )}
            {datePart1 && timePart1 && (
              <p className="mt-4 text-xs text-muted-foreground">
                Duración: {durationPart1} minutos
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Part 2 Selection */}
      <div className="space-y-4 pt-6 border-t">
        <h3 className="text-lg font-semibold text-foreground">Parte 2 - Finalización</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h4 className="mb-4 font-medium text-foreground">Selecciona fecha</h4>
            <Calendar
              mode="single"
              selected={datePart2}
              onSelect={setDatePart2}
              disabled={disabledDays}
              weekStartsOn={1}
              locale={es}
              className={cn("rounded-md border pointer-events-auto")}
            />
          </div>

          <div>
            <h4 className="mb-4 font-medium text-foreground">Selecciona hora</h4>
            {!datePart2 ? (
              <p className="text-sm text-muted-foreground">
                Primero selecciona una fecha
              </p>
            ) : loadingPart2 ? (
              <p className="text-sm text-muted-foreground">
                Cargando horarios disponibles...
              </p>
            ) : timeSlotsPart2.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay horarios disponibles para este día.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
                {timeSlotsPart2.map((slot) => (
                  <Button
                    key={slot}
                    variant={timePart2 === slot ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimePart2(slot)}
                    className={cn(
                      timePart2 === slot && "bg-primary text-primary-foreground"
                    )}
                  >
                    {slot}
                  </Button>
                ))}
              </div>
            )}
            {datePart2 && timePart2 && (
              <p className="mt-4 text-xs text-muted-foreground">
                Duración: {durationPart2} minutos
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Volver
        </Button>
        <Button onClick={handleNext} disabled={!datePart1 || !timePart1 || !datePart2 || !timePart2}>
          Continuar
        </Button>
      </div>
    </div>
  );
};