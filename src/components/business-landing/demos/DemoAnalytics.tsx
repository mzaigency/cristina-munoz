import { motion } from "motion/react";
import { TrendingUp, Users, Calendar, Euro, ArrowUp, ArrowDown } from "lucide-react";
import { demoStats, demoWeeklyData, demoPopularServices } from "./demoData";

const DemoAnalytics = () => {
  const maxRevenue = Math.max(...demoWeeklyData.map(d => d.revenue));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-background rounded-2xl shadow-2xl overflow-hidden border border-border/50"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 px-4 py-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm">Estadísticas</h3>
            <p className="text-xs text-muted-foreground">Esta semana</p>
          </div>
          <div className="flex gap-1">
            <button className="px-2 py-1 bg-primary text-primary-foreground rounded-md text-[10px] font-medium">
              Semana
            </button>
            <button className="px-2 py-1 text-muted-foreground rounded-md text-[10px]">
              Mes
            </button>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="p-3 grid grid-cols-2 gap-2">
        {[
          { label: "Ingresos", value: `${demoStats.weekRevenue}€`, icon: Euro, change: 15, color: "text-green-500", bg: "bg-green-500/10" },
          { label: "Reservas", value: demoStats.bookingsWeek, icon: Calendar, change: 8, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Clientes nuevos", value: demoStats.newClients, icon: Users, change: -3, color: "text-orange-500", bg: "bg-orange-500/10" },
          { label: "Ticket medio", value: `${demoStats.avgTicket}€`, icon: TrendingUp, change: 12, color: "text-purple-500", bg: "bg-purple-500/10" },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.1 }}
            className="bg-muted/30 rounded-xl p-2.5"
          >
            <div className="flex items-center justify-between mb-1">
              <div className={`w-6 h-6 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
              </div>
              <div className={`flex items-center gap-0.5 text-[9px] font-medium ${
                stat.change > 0 ? "text-green-500" : "text-red-500"
              }`}>
                {stat.change > 0 ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                {Math.abs(stat.change)}%
              </div>
            </div>
            <div className="text-base font-bold">{stat.value}</div>
            <div className="text-[9px] text-muted-foreground">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <div className="px-3 pb-3">
        <h4 className="text-xs font-medium text-muted-foreground mb-2">Ingresos semanales</h4>
        <div className="h-20 flex items-end justify-between gap-1">
          {demoWeeklyData.map((day, index) => (
            <motion.div
              key={day.day}
              className="flex-1 flex flex-col items-center gap-1"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.4 + index * 0.05, type: "spring" }}
              style={{ transformOrigin: "bottom" }}
            >
              <div 
                className={`w-full rounded-t-md ${day.revenue > 0 ? "bg-gradient-to-t from-primary to-primary/60" : "bg-muted/30"}`}
                style={{ height: `${(day.revenue / maxRevenue) * 100}%`, minHeight: day.revenue > 0 ? "8px" : "4px" }}
              />
              <span className="text-[8px] text-muted-foreground">{day.day}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Popular services */}
      <div className="px-3 pb-3">
        <h4 className="text-xs font-medium text-muted-foreground mb-2">Servicios populares</h4>
        <div className="space-y-1.5">
          {demoPopularServices.slice(0, 3).map((service, index) => (
            <motion.div
              key={service.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="flex items-center gap-2"
            >
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-medium">{service.name}</span>
                  <span className="text-[9px] text-muted-foreground">{service.percentage}%</span>
                </div>
                <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${service.percentage}%` }}
                    transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default DemoAnalytics;
