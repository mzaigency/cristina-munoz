import { motion } from "framer-motion";
import { MessageCircle, CalendarClock, Receipt, Globe2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Storytelling móvil — versión estática y vertical del relato del hero.
 * Sustituye al pin GSAP en pantallas <md. Cada beat es una tarjeta
 * dolor→solución que aparece al entrar en viewport, sin scrubbing.
 */

type Beat = {
  icon: typeof MessageCircle;
  painTitle: string;
  painLine: string;
  solTitle: string;
  solLine: string;
};

const BEATS: Beat[] = [
  {
    icon: MessageCircle,
    painTitle: "El móvil no para.",
    painLine: "WhatsApps a todas horas: «¿tenéis hueco?», «¿cuánto cuesta?», «¿abrís el sábado?».",
    solTitle: "Glowapp responde por ti.",
    solLine: "Reservas solas 24/7. Confirmaciones automáticas. Tú, tranquila.",
  },
  {
    icon: CalendarClock,
    painTitle: "La agenda, un caos.",
    painLine: "Huecos perdidos, dobles citas, clientas que no aparecen.",
    solTitle: "Una agenda que se gestiona sola.",
    solLine: "Recordatorios, lista de espera y reprogramación en un toque.",
  },
  {
    icon: Receipt,
    painTitle: "Tickets a mano.",
    painLine: "Cuadrar la caja a fin de día, calcular comisiones, tirar de Excel.",
    solTitle: "Caja, tickets y comisiones, listos.",
    solLine: "Cobra, imprime y al cierre te lo damos cuadrado.",
  },
  {
    icon: Globe2,
    painTitle: "Sin web propia.",
    painLine: "Tu Instagram no convierte y Google te esconde detrás de la competencia.",
    solTitle: "Tu salón, con web propia.",
    solLine: "Una landing bonita, SEO local y reservas directas desde Google.",
  },
];

export const MobileHeroStory = () => {
  const navigate = useNavigate();

  return (
    <section className="relative w-full bg-background px-5 py-16 md:hidden">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        {BEATS.map((beat, i) => (
          <motion.article
            key={beat.painTitle}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1], delay: 0.05 }}
            className="relative overflow-hidden rounded-3xl border border-foreground/5 bg-gradient-to-br from-[#f4f7fb] to-[#ece8f4] p-5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.12)]"
          >
            <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-foreground/5">
                <beat.icon className="h-3.5 w-3.5" />
              </span>
              {i === 0 ? "DOLOR 1" : `DOLOR 0${i + 1}`}
            </div>

            <h3 className="font-sans text-2xl font-bold leading-tight tracking-tight text-foreground/85">
              {beat.painTitle}
            </h3>
            <p className="mt-1.5 text-sm font-light leading-relaxed text-muted-foreground">
              {beat.painLine}
            </p>

            <div className="my-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/70">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              con Glowapp
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            </div>

            <h4 className="ch-text-gradient font-serif text-2xl italic leading-tight tracking-tight">
              {beat.solTitle}
            </h4>
            <p className="mt-1.5 text-sm font-light leading-relaxed text-muted-foreground">
              {beat.solLine}
            </p>
          </motion.article>
        ))}

        {/* Slogan + CTA cierre */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="mt-2 rounded-3xl bg-gradient-to-br from-primary to-accent p-6 text-center text-white shadow-[0_20px_50px_-15px_hsl(var(--primary)/0.5)]"
        >
          <p className="font-sans text-xl font-bold leading-tight">
            El software de salón
          </p>
          <p className="font-serif text-3xl italic leading-tight">
            que se paga solo.
          </p>
          <button
            onClick={() => navigate("/onboarding")}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-primary shadow-md transition-transform active:scale-[0.98]"
          >
            Crea tu salón gratis
            <ArrowRight className="h-4 w-4" />
          </button>
          <p className="mt-3 text-xs text-white/75">Sin permanencia · 5 minutos</p>
        </motion.div>
      </div>
    </section>
  );
};
