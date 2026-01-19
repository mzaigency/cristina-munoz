import { motion } from "motion/react";
import { Star, MapPin, Clock, ChevronRight } from "lucide-react";
import { demoServices, demoSalonInfo } from "./demoData";

const DemoLanding = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-background min-h-full overflow-hidden flex flex-col"
    >
      {/* Hero */}
      <div className="relative h-32 bg-gradient-to-br from-primary/80 to-secondary/80 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjEiLz48L3N2Zz4=')] opacity-50" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-2"
          >
            <span className="text-xl font-bold">BS</span>
          </motion.div>
          <motion.h2
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm font-bold text-center"
          >
            {demoSalonInfo.name}
          </motion.h2>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-[10px] text-white/80"
          >
            {demoSalonInfo.tagline}
          </motion.p>
        </div>
      </div>

      {/* Rating & Location */}
      <div className="px-4 py-3 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
            <span className="text-xs font-semibold">{demoSalonInfo.rating}</span>
            <span className="text-[10px] text-muted-foreground">({demoSalonInfo.reviewCount} reseñas)</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <MapPin className="w-3 h-3" />
            Centro, Madrid
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="p-3 flex-1">
        <h4 className="text-xs font-semibold mb-2">Servicios</h4>
        <div className="space-y-1.5">
          {demoServices.slice(0, 4).map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="flex items-center justify-between p-2 bg-muted/20 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer"
            >
              <div>
                <div className="text-xs font-medium">{service.name}</div>
                <div className="text-[9px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {service.duration} min
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold">{service.price}€</span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </motion.div>
          ))}
        </div>
        <button className="w-full mt-2 text-[10px] text-primary font-medium">
          Ver todos los servicios →
        </button>
      </div>

      {/* CTA */}
      <div className="p-3 pt-0">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-xs font-semibold"
        >
          Reservar ahora
        </motion.button>
      </div>

      {/* Footer */}
      <div className="bg-muted/30 px-4 py-2 border-t border-border/30 flex items-center justify-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[10px] text-muted-foreground">Disponible hoy</span>
      </div>
    </motion.div>
  );
};

export default DemoLanding;
