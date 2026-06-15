import { Star, MapPin, Clock } from "lucide-react";

/**
 * Pantalla de la web pública / reserva (lo que ve el CLIENTE del salón).
 * Réplica visual ligera de la landing tenant: cabecera con marca, servicios
 * con precio, selector de hora y CTA de reserva. UI clara.
 */
export const BookingMockup = () => {
  return (
    <div className="flex h-full w-full flex-col bg-white font-sans text-slate-900">
      {/* Hero */}
      <div className="relative h-32 shrink-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ backgroundImage: "linear-gradient(140deg, hsl(var(--primary)), hsl(var(--accent)))" }}
        />
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute bottom-3 left-4 right-4 text-white">
          <p className="font-serif text-lg italic leading-tight">Cristina Muñoz</p>
          <div className="mt-1 flex items-center gap-3 text-[10px] text-white/85">
            <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-white" /> 4,9</span>
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Santpedor</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Abierto</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
        <p className="text-[12px] font-semibold text-slate-700">Elige tu servicio</p>

        {[
          { name: "Corte + peinado", dur: "45 min", price: "25€" },
          { name: "Color completo", dur: "1 h 30", price: "55€" },
          { name: "Mechas balayage", dur: "2 h", price: "80€" },
        ].map((s, i) => (
          <div
            key={s.name}
            className={`flex items-center gap-3 rounded-2xl border p-3 ${
              i === 0 ? "border-transparent shadow-sm ring-2" : "border-slate-200/70"
            }`}
            style={i === 0 ? { boxShadow: "0 4px 14px -4px hsl(var(--primary)/0.3)", ["--tw-ring-color" as string]: "hsl(var(--primary)/0.5)" } : undefined}
          >
            <div
              className="h-10 w-10 shrink-0 rounded-xl"
              style={{ backgroundImage: "linear-gradient(135deg, hsl(var(--primary)/0.18), hsl(var(--accent)/0.12))" }}
            />
            <div className="flex-1">
              <p className="text-[13px] font-semibold leading-tight">{s.name}</p>
              <p className="text-[10px] text-slate-400">{s.dur}</p>
            </div>
            <span className="text-[13px] font-bold tabular-nums">{s.price}</span>
          </div>
        ))}

        {/* Time slots */}
        <p className="mt-1 text-[12px] font-semibold text-slate-700">Hoy · elige hora</p>
        <div className="flex flex-wrap gap-2">
          {["10:00", "11:30", "13:00", "17:30", "18:15"].map((t, i) => (
            <span
              key={t}
              className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium ${
                i === 3 ? "text-white shadow-sm" : "bg-slate-100 text-slate-600"
              }`}
              style={i === 3 ? { backgroundImage: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" } : undefined}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="border-t border-slate-100 bg-white p-3">
        <button
          className="w-full rounded-xl py-3 text-[13px] font-semibold text-white shadow-md"
          style={{ backgroundImage: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
        >
          Reservar · Corte + peinado · 17:30
        </button>
      </div>
    </div>
  );
};
