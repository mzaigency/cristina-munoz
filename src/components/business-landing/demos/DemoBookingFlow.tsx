import { motion } from "motion/react";
import { Check, Clock, Euro } from "lucide-react";
import { useState } from "react";
import { demoServices, demoAvailableSlots, demoStylists } from "./demoData";

const DemoBookingFlow = () => {
  const [selectedServices, setSelectedServices] = useState<string[]>(["1", "2"]);
  const [selectedSlot, setSelectedSlot] = useState("14:00");
  const [selectedStylist, setSelectedStylist] = useState("1");

  const toggleService = (id: string) => {
    setSelectedServices(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const selectedTotal = demoServices
    .filter(s => selectedServices.includes(s.id))
    .reduce((sum, s) => sum + s.price, 0);

  const selectedDuration = demoServices
    .filter(s => selectedServices.includes(s.id))
    .reduce((sum, s) => sum + s.duration, 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-background min-h-full overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-4 py-3 border-b border-border/50">
        <h3 className="font-semibold text-sm">Reservar cita</h3>
        <p className="text-xs text-muted-foreground">Beauty Studio Madrid</p>
      </div>

      <div className="p-3 space-y-4 flex-1 overflow-y-auto">
        {/* Services */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Servicios</h4>
          <div className="space-y-1.5">
            {demoServices.slice(0, 4).map((service, index) => (
              <motion.button
                key={service.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => toggleService(service.id)}
                className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all ${
                  selectedServices.includes(service.id)
                    ? "border-primary bg-primary/10"
                    : "border-border/50 hover:border-border"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                    selectedServices.includes(service.id)
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/30"
                  }`}>
                    {selectedServices.includes(service.id) && (
                      <Check className="w-2.5 h-2.5 text-primary-foreground" />
                    )}
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-medium">{service.name}</div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {service.duration} min
                    </div>
                  </div>
                </div>
                <span className="text-xs font-semibold">{service.price}€</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Stylist selection */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Estilista</h4>
          <div className="flex gap-2">
            {demoStylists.map((stylist) => (
              <button
                key={stylist.id}
                onClick={() => setSelectedStylist(stylist.id)}
                className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                  selectedStylist === stylist.id
                    ? "border-primary bg-primary/10"
                    : "border-border/50 hover:border-border"
                }`}
              >
                <div 
                  className="w-6 h-6 rounded-full mx-auto mb-1 flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ backgroundColor: stylist.color }}
                >
                  {stylist.name[0]}
                </div>
                {stylist.name}
              </button>
            ))}
          </div>
        </div>

        {/* Time slots */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Horario disponible</h4>
          <div className="grid grid-cols-4 gap-1.5">
            {demoAvailableSlots.map((slot, index) => (
              <motion.button
                key={slot}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.03 }}
                onClick={() => setSelectedSlot(slot)}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-medium transition-all ${
                  selectedSlot === slot
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 hover:bg-muted text-foreground"
                }`}
              >
                {slot}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-muted/30 px-4 py-3 border-t border-border/30">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {selectedDuration} min
            </span>
          </div>
          <div className="text-sm font-bold flex items-center gap-0.5">
            <Euro className="w-3.5 h-3.5" />
            {selectedTotal}
          </div>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-xs font-semibold"
        >
          Confirmar reserva
        </motion.button>
      </div>
    </motion.div>
  );
};

export default DemoBookingFlow;
