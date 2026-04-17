import { motion } from "framer-motion";
import { Check, Clock, ChevronRight, ArrowLeft } from "lucide-react";
import { DemoShell } from "./_shared/DemoShell";
import { demoServices, demoAvailableSlots } from "./demoData";

/**
 * Clon visual del BookingFlow real (TenantBookingFlow):
 * - Stepper superior (Servicio → Profesional → Fecha → Hora → Confirmar)
 * - Chips de hora estilo cliente
 * - Total sticky inferior
 */
const DemoBookingFlow = () => {
  const steps = ["Servicio", "Pro", "Fecha", "Hora"];
  const activeStep = 2;

  return (
    <DemoShell>
      <div className="bg-background min-h-full flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center gap-2 sticky top-0 bg-background z-10">
          <div className="h-8 w-8 rounded-full border border-border flex items-center justify-center">
            <ArrowLeft className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold">Reservar cita</p>
            <p className="text-[10px] text-muted-foreground">Paso {activeStep + 1} de 4</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-1.5">
            {steps.map((label, i) => (
              <div key={label} className="flex-1 flex items-center gap-1">
                <div
                  className={`flex-1 h-1 rounded-full transition-colors ${
                    i <= activeStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            {steps.map((label, i) => (
              <p
                key={label}
                className={`text-[9px] ${
                  i <= activeStep ? "text-primary font-semibold" : "text-muted-foreground"
                }`}
              >
                {label}
              </p>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground font-medium">Servicios seleccionados</p>
            {demoServices.slice(0, 2).map((s) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/20"
              >
                <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <Check className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {s.duration} min
                  </p>
                </div>
                <p className="text-xs font-bold">{s.price}€</p>
              </motion.div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground font-medium">Horarios disponibles</p>
            <div className="grid grid-cols-3 gap-1.5">
              {demoAvailableSlots.map((slot, i) => (
                <motion.div
                  key={slot}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className={`py-2 rounded-lg text-center text-[11px] font-semibold ${
                    slot === "10:00"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground border border-border"
                  }`}
                >
                  {slot}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Total sticky inferior */}
        <div className="border-t border-border bg-background/95 backdrop-blur-sm px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] text-muted-foreground">Total estimado</p>
            <p className="text-base font-bold">70€</p>
          </div>
          <div className="w-full h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold gap-1">
            Confirmar reserva <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </DemoShell>
  );
};

export default DemoBookingFlow;
