import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { demoAppointments, demoStylists } from "./demoData";

const DemoCalendar = () => {
  const hours = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
  const currentHour = 11; // Simular hora actual

  const getAppointmentPosition = (time: string) => {
    const [hour, minutes] = time.split(":").map(Number);
    return ((hour - 9) * 60 + minutes) / 60;
  };

  const getAppointmentDuration = (startTime: string, endTime: string) => {
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    return ((endH * 60 + endM) - (startH * 60 + startM)) / 60;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-background rounded-2xl shadow-2xl overflow-hidden border border-border/50"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-4 py-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <span className="font-semibold text-sm">Hoy, 19 Enero</span>
            <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <button className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-primary/90 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Nueva cita
          </button>
        </div>
        
        {/* Stylists filter */}
        <div className="flex gap-2 mt-3">
          {demoStylists.map((stylist) => (
            <div
              key={stylist.id}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: `${stylist.color}20`, color: stylist.color }}
            >
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: stylist.color }}
              />
              {stylist.name}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="relative h-[280px] overflow-hidden">
        {/* Time column */}
        <div className="absolute left-0 top-0 w-12 h-full bg-muted/30 border-r border-border/30 z-10">
          {hours.map((hour, i) => (
            <div 
              key={hour}
              className="absolute left-0 w-full text-[10px] text-muted-foreground text-right pr-2"
              style={{ top: `${i * 28}px` }}
            >
              {hour}
            </div>
          ))}
        </div>

        {/* Grid lines */}
        <div className="absolute left-12 right-0 top-0 h-full">
          {hours.map((_, i) => (
            <div 
              key={i}
              className="absolute left-0 right-0 border-t border-border/20"
              style={{ top: `${i * 28}px` }}
            />
          ))}

          {/* Current time line */}
          <motion.div 
            className="absolute left-0 right-0 h-0.5 bg-red-500 z-20"
            style={{ top: `${(currentHour - 9) * 28 + 14}px` }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <div className="absolute -left-1 -top-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
          </motion.div>

          {/* Appointments */}
          {demoAppointments.map((apt, index) => {
            const top = getAppointmentPosition(apt.time) * 28;
            const height = getAppointmentDuration(apt.time, apt.endTime) * 28;
            const leftOffset = apt.stylistId === "1" ? 0 : apt.stylistId === "2" ? 33 : 66;
            
            return (
              <motion.div
                key={apt.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="absolute rounded-lg p-1.5 text-white overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
                style={{
                  top: `${top}px`,
                  height: `${Math.max(height - 2, 20)}px`,
                  left: `${leftOffset}%`,
                  width: "32%",
                  backgroundColor: apt.color,
                }}
              >
                <div className="text-[9px] font-semibold truncate">{apt.client}</div>
                <div className="text-[8px] opacity-80 truncate">{apt.service}</div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-muted/30 px-4 py-2 border-t border-border/30 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">7 citas hoy</span>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-[10px] text-muted-foreground">3 disponibles</span>
        </div>
      </div>
    </motion.div>
  );
};

export default DemoCalendar;
