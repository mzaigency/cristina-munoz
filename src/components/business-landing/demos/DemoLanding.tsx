import { motion } from "framer-motion";
import { Star, MapPin, Clock, Phone } from "lucide-react";
import { DemoShell } from "./_shared/DemoShell";
import { demoServices, demoSalonInfo } from "./demoData";

/**
 * Clon visual reducido de TenantHero (variante HeroGlass) + TenantServicesSection.
 * - Foto de fondo + overlay glass
 * - Badge de rating arriba
 * - Glass card con nombre + tagline + CTA
 * - Sección de servicios con cards
 */
const DemoLanding = () => {
  return (
    <DemoShell>
      <div className="bg-background min-h-full">
        {/* Hero Glass (clon de HeroGlass) */}
        <div className="relative h-72">
          {/* Foto de fondo */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${demoSalonInfo.heroImage})` }}
          />
          {/* Overlay degradado */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40" />

          {/* Rating badge top */}
          <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-[11px] font-bold text-white">{demoSalonInfo.rating}</span>
            <span className="text-[10px] text-white/80">({demoSalonInfo.reviewCount})</span>
          </div>

          {/* Glass card central */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/20"
          >
            <h1 className="text-base font-bold text-white leading-tight mb-1">
              {demoSalonInfo.name}
            </h1>
            <p className="text-[11px] text-white/80 mb-3">{demoSalonInfo.tagline}</p>
            <div className="flex gap-2">
              <div className="flex-1 h-8 rounded-full bg-white text-foreground text-[11px] font-semibold flex items-center justify-center">
                Reservar
              </div>
              <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
                <Phone className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Info bar */}
        <div className="px-4 py-3 border-b border-border flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>Centro, Madrid</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Abierto</span>
          </div>
        </div>

        {/* Servicios (clon TenantServicesSection) */}
        <div className="p-4 space-y-3">
          <h3 className="text-sm font-bold">Nuestros servicios</h3>
          {demoServices.slice(0, 4).map((service, i) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="flex items-center justify-between p-3 rounded-xl border border-border bg-card"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{service.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {service.duration} min
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-primary">{service.price}€</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </DemoShell>
  );
};

export default DemoLanding;
