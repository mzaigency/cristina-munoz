import { motion } from "framer-motion";
import { Star, Quote, Scissors, HeartPulse } from "lucide-react";
import { EASE, SectionHeader } from "./_landingShared";

/**
 * Testimonios de los dos salones reales que usan Glowapp. Cita editorial
 * (Playfair italic), avatar con iniciales en gradiente de marca, sector y una
 * métrica de resultado destacada. Prueba social verificable.
 */

const TESTIMONIALS = [
  {
    initials: "CM",
    name: "Cristina Muñoz",
    sector: "Peluquería · Madrid",
    Icon: Scissors,
    quote:
      "Antes vivía pegada al teléfono. Ahora las clientas reservan solas, hasta de madrugada, y yo abro la app y veo el día ya montado.",
    metric: "8 de cada 10 reservas",
    metricLabel: "llegan sin que coja el teléfono",
  },
  {
    initials: "MF",
    name: "Montserrat Faig",
    sector: "Fisioterapia · Barcelona",
    Icon: HeartPulse,
    quote:
      "Los pacientes que faltaban sin avisar eran mi pesadilla. Con los recordatorios automáticos los plantones casi han desaparecido.",
    metric: "Plantones bajo control",
    metricLabel: "los recordatorios hacen el trabajo",
  },
];

export const SalonTestimonials = () => {
  return (
    <section className="relative scroll-mt-20 py-24 md:py-32">
      <div className="container mx-auto px-4">
        <SectionHeader
          eyebrow="Salones reales"
          title={
            <>
              No te lo decimos nosotros.{" "}
              <span
                className="font-serif italic"
                style={{ background: "linear-gradient(100deg, hsl(var(--primary)), hsl(var(--accent)))", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
              >
                Te lo dicen ellas.
              </span>
            </>
          }
          subtitle="Negocios que cambiaron la libreta por Glowapp y no han vuelto atrás."
          className="mb-16"
        />

        <motion.div
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.16 } } }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          style={{ perspective: 1300 }}
          className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2"
        >
          {TESTIMONIALS.map((t) => (
            <motion.figure
              key={t.name}
              variants={{
                hidden: { opacity: 0, y: 40, rotateX: 10, scale: 0.96 },
                show: { opacity: 1, y: 0, rotateX: 0, scale: 1, transition: { type: "spring", duration: 0.8, bounce: 0.2 } },
              }}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-card/85 p-8 shadow-sm backdrop-blur-sm transition-shadow duration-300 hover:shadow-[0_24px_50px_-16px_rgba(20,22,48,0.16)]"
            >
              <Quote className="absolute right-7 top-7 h-10 w-10 text-primary/10" />

              {/* Estrellas */}
              <div className="mb-5 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Cita */}
              <blockquote className="font-serif text-xl italic leading-relaxed text-foreground sm:text-2xl">
                «{t.quote}»
              </blockquote>

              {/* Métrica destacada */}
              <div className="mt-6 inline-flex w-fit flex-col rounded-2xl bg-primary/[0.06] px-4 py-3">
                <span
                  className="text-lg font-bold tracking-tight"
                  style={{ background: "linear-gradient(100deg, hsl(var(--primary)), hsl(var(--accent)))", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
                >
                  {t.metric}
                </span>
                <span className="text-xs text-muted-foreground">{t.metricLabel}</span>
              </div>

              {/* Autora */}
              <figcaption className="mt-7 flex items-center gap-3 border-t border-border/60 pt-6">
                <span
                  className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl text-sm font-bold text-white shadow-md"
                  style={{ backgroundImage: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
                >
                  {t.initials}
                </span>
                <div>
                  <p className="font-semibold text-foreground">{t.name}</p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <t.Icon className="h-3 w-3" /> {t.sector}
                  </p>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
