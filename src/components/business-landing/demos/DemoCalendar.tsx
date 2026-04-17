import { motion } from "framer-motion";
import { CheckCheck, Plus, Search } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DemoShell } from "./_shared/DemoShell";
import { demoStylists, demoAppointments } from "./demoData";

// Misma constante visual que LocalCalendarCRM (2px/min = 120px/hora)
const PIXELS_PER_MINUTE = 2;
const START_HOUR = 9;
const END_HOUR = 19;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

const timeToMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

/**
 * Clon visual del LocalCalendarCRM real.
 * - 2px/minuto, columna de horas izquierda
 * - Línea de hora actual roja
 * - Badge CheckCheck verde para confirmadas por WhatsApp
 * - Color por estilista
 */
const DemoCalendar = () => {
  // Hora actual simulada: 11:45
  const simulatedNowMinutes = 11 * 60 + 45;
  const nowOffset = (simulatedNowMinutes - START_HOUR * 60) * PIXELS_PER_MINUTE;

  return (
    <DemoShell>
      <div className="bg-background min-h-full">
        {/* Header tipo admin: fecha + acciones */}
        <div className="sticky top-0 z-20 bg-background border-b border-border px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-base font-bold text-foreground">
                {format(new Date(), "EEEE d", { locale: es })}
              </h2>
              <p className="text-xs text-muted-foreground">Hoy · {demoAppointments.length} citas</p>
            </div>
            <div className="flex gap-1.5">
              <div className="h-8 w-8 rounded-full border border-border flex items-center justify-center">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="h-8 px-3 rounded-full bg-primary text-primary-foreground flex items-center gap-1 text-xs font-medium">
                <Plus className="h-3.5 w-3.5" /> Nueva
              </div>
            </div>
          </div>
        </div>

        {/* Grid del calendario */}
        <div className="flex">
          {/* Columna de horas */}
          <div className="w-12 shrink-0 border-r border-border">
            {HOURS.map((h) => (
              <div
                key={h}
                className="text-[10px] text-muted-foreground text-right pr-2 font-mono"
                style={{ height: `${60 * PIXELS_PER_MINUTE}px` }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* Columnas por estilista */}
          <div className="flex-1 flex relative">
            {demoStylists.map((stylist) => {
              const stylistBookings = demoAppointments.filter((b) => b.stylist === stylist.slug);
              return (
                <div
                  key={stylist.id}
                  className="flex-1 relative border-r border-border last:border-r-0"
                >
                  {/* Header estilista */}
                  <div className="sticky top-[60px] z-10 bg-background/95 backdrop-blur-sm border-b border-border px-2 py-1.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: stylist.color }}
                      />
                      <span className="text-[11px] font-semibold">{stylist.name}</span>
                    </div>
                  </div>

                  {/* Lineas de hora */}
                  <div
                    className="relative"
                    style={{
                      height: `${(END_HOUR - START_HOUR + 1) * 60 * PIXELS_PER_MINUTE}px`,
                    }}
                  >
                    {HOURS.map((h, i) => (
                      <div
                        key={h}
                        className="absolute left-0 right-0 border-t border-border/40"
                        style={{ top: `${i * 60 * PIXELS_PER_MINUTE}px` }}
                      />
                    ))}

                    {/* Citas */}
                    {stylistBookings.map((booking, idx) => {
                      const startMin = timeToMinutes(booking.Hora) - START_HOUR * 60;
                      const top = startMin * PIXELS_PER_MINUTE;
                      const height = Math.max(booking.total_duration * PIXELS_PER_MINUTE, 40);
                      return (
                        <motion.div
                          key={booking.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.05 * idx }}
                          className="absolute left-0.5 right-0.5 rounded-md p-1.5 overflow-hidden shadow-sm"
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            backgroundColor: `${booking.color}20`,
                            borderLeft: `3px solid ${booking.color}`,
                          }}
                        >
                          <div className="flex items-center gap-1">
                            <p className="text-[10px] font-mono font-semibold leading-tight">
                              {booking.Hora}
                            </p>
                            {booking.reminder_sent === "confirmado" && (
                              <CheckCheck className="h-2.5 w-2.5 text-green-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-[10px] font-semibold leading-tight truncate">
                            {booking.customer_name}
                          </p>
                          {height > 50 && (
                            <p className="text-[9px] text-muted-foreground leading-tight truncate">
                              {booking.services[0].name}
                            </p>
                          )}
                        </motion.div>
                      );
                    })}

                    {/* Línea hora actual roja */}
                    <div
                      className="absolute left-0 right-0 z-20 pointer-events-none"
                      style={{ top: `${nowOffset}px` }}
                    >
                      <div className="flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 -ml-0.5" />
                        <div className="flex-1 h-px bg-red-500" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DemoShell>
  );
};

export default DemoCalendar;
