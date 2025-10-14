import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Stylist } from "./BookingFlow";

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

  // Generate available time slots based on day and duration
  const getAvailableTimeSlots = (selectedDate: Date | undefined) => {
    if (!selectedDate) return [];

    const day = selectedDate.getDay();
    const slots: string[] = [];

    // Tuesday to Friday: 9:00-12:30 and 15:00-19:00
    if (day >= 2 && day <= 5) {
      // Morning slots (9:00 - 12:30)
      for (let hour = 9; hour < 12; hour++) {
        slots.push(`${hour.toString().padStart(2, "0")}:00`);
        slots.push(`${hour.toString().padStart(2, "0")}:30`);
      }
      slots.push("12:00");
      
      // Afternoon slots (15:00 - 19:00)
      for (let hour = 15; hour < 19; hour++) {
        slots.push(`${hour.toString().padStart(2, "0")}:00`);
        slots.push(`${hour.toString().padStart(2, "0")}:30`);
      }
    }
    // Saturday: 8:00-13:00
    else if (day === 6) {
      for (let hour = 8; hour < 13; hour++) {
        slots.push(`${hour.toString().padStart(2, "0")}:00`);
        slots.push(`${hour.toString().padStart(2, "0")}:30`);
      }
    }

    return slots;
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
          ) : timeSlots.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay horarios disponibles para este día
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
