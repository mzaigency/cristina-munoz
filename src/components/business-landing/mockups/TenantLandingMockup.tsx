import { Star, MapPin, Clock, Scissors, ArrowRight } from "lucide-react";

/**
 * Réplica fiel de la landing pública real (Cristina Muñoz): cabecera tipo
 * TenantHero (imagen + nombre editorial Playfair + rating + CTA) y sección de
 * servicios tipo TenantServices (cards con nombre, precio y duración). Mismo
 * lenguaje visual que la web real del tenant. Estático, sin datos en vivo.
 */

const SERVICES = [
  { name: "Corte + peinado", dur: "45 min", price: "25 €" },
  { name: "Color completo", dur: "1 h 30", price: "55 €" },
  { name: "Mechas balayage", dur: "2 h", price: "80 €" },
  { name: "Tratamiento keratina", dur: "1 h 15", price: "65 €" },
];

export const TenantLandingMockup = () => {
  return (
    <div className="h-full w-full overflow-hidden bg-background font-sans text-foreground">
      {/* Hero — estilo TenantHero */}
      <div className="relative h-44 overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(150deg, hsl(var(--primary)), hsl(var(--accent)))" }} />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <p className="font-serif text-2xl italic leading-none tracking-tight">Cristina Muñoz</p>
          <p className="mt-1 text-[11px] text-white/85">Peluquería & estética · cuidamos tu imagen</p>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-white/90">
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> 4,9 · 128 reseñas
            </span>
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Madrid</span>
          </div>
          <button
            className="mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-primary shadow-lg"
            style={{ background: "white" }}
          >
            Reservar cita <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Servicios — estilo TenantServices */}
      <div className="bg-muted/30 px-4 py-5">
        <h2 className="mb-1 text-center text-lg font-bold">Nuestros Servicios</h2>
        <p className="mb-4 text-center text-[11px] text-muted-foreground">Elige el tuyo y reserva en segundos</p>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Scissors className="h-4 w-4 text-primary" /> Peluquería
        </h3>
        <div className="grid grid-cols-1 gap-2.5">
          {SERVICES.map((s) => (
            <div key={s.name} className="rounded-xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{s.name}</span>
                <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-bold text-secondary-foreground">{s.price}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" /> {s.dur}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
