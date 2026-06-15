import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Scissors, HeartPulse, Star } from "lucide-react";
import { AnimatedNumber, EASE, gradientText } from "./_landingShared";

/**
 * Franja de prueba social bajo el hero. Dos capas:
 *  1) Métricas honestas del producto (count-up al entrar en viewport).
 *  2) Negocios REALES que ya funcionan con Glowapp (Cristina Muñoz · Montserrat
 *     Faig) — prueba social verificable, no números inflados.
 */

interface Stat {
  value: number;
  format: (v: number) => string;
  label: string;
}
const STATS: Stat[] = [
  { value: 5, format: (v) => `${Math.round(v)} min`, label: "para montar tu salón" },
  { value: 0, format: () => "0 €", label: "para empezar, sin tarjeta" },
  { value: 24, format: () => "24/7", label: "reservas, también de noche" },
  { value: 25, format: (v) => `−${Math.round(v)}%`, label: "plantones con recordatorios" },
];

const CRISTINA_LOGO =
  "https://lyeyzdbplrgqsvyxpfek.supabase.co/storage/v1/object/public/tenant-assets/a1b2c3d4-e5f6-7890-abcd-ef1234567890/logo-1766948799579.png";

const SALONS = [
  { name: "Cristina Muñoz", sector: "Peluquería · Santpedor", Icon: Scissors, logo: CRISTINA_LOGO as string | null },
  { name: "Montserrat Faig", sector: "Fisioterapia · Manresa", Icon: HeartPulse, logo: null as string | null },
];

export const SocialProofStrip = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative py-14 md:py-20">
      <div className="container mx-auto px-4">
        {/* Métricas */}
        <div
          ref={ref}
          className="mx-auto grid max-w-5xl grid-cols-2 gap-y-10 rounded-3xl border border-border/60 bg-card/70 px-6 py-10 shadow-sm backdrop-blur-sm md:grid-cols-4 md:gap-x-4 md:px-10"
        >
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 18 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.5, ease: EASE }}
              className="relative text-center md:px-4"
            >
              {i > 0 && (
                <span className="absolute left-0 top-1/2 hidden h-10 w-px -translate-y-1/2 bg-border md:block" />
              )}
              <div
                className="text-4xl font-bold tracking-tight tabular-nums sm:text-5xl"
                style={gradientText}
              >
                <AnimatedNumber value={inView ? s.value : 0} format={s.format} />
              </div>
              <p className="mt-2 text-xs leading-snug text-muted-foreground sm:text-sm">
                {s.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Negocios reales */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mx-auto mt-10 flex max-w-3xl flex-col items-center gap-5 sm:flex-row sm:justify-center sm:gap-10"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Negocios reales que ya funcionan con <span className="font-ashing">Glowapp</span>
          </p>
          <div className="flex items-center gap-6">
            {SALONS.map(({ name, sector, Icon }) => (
              <div key={name} className="flex items-center gap-2.5">
                <span
                  className="flex h-9 w-9 flex-none items-center justify-center rounded-xl text-white shadow-sm"
                  style={{ backgroundImage: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="text-left leading-tight">
                  <p className="text-sm font-semibold text-foreground">{name}</p>
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" /> {sector}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
