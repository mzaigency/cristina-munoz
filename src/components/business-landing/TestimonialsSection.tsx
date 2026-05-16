import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { SectionEyebrow } from "./SectionEyebrow";

const testimonials = [
  {
    initials: "CM",
    name: "Cristina Muñoz",
    salon: "Cristina Muñoz Perruqueria",
    city: "Barcelona",
    since: "2024",
    quote:
      "Pasé de apuntar citas en una libreta a tener reservas online mientras duermo. Mis sábados ya no son un caos.",
    metric: "+22 reservas / semana",
    gradient: "from-primary/15 to-accent/10",
  },
];

export const TestimonialsSection = () => {
  return (
    <section className="py-16 md:py-24 bg-secondary/40 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-14"
        >
          <SectionEyebrow label="Voces de verdad" tone="accent" />
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-3 mb-3 text-foreground">
            Lo que dicen quienes ya brillan
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Profesionales reales con resultados reales. Sin filtros, sin storytelling de agencia.
          </p>
        </motion.div>

        {/* Mobile: horizontal snap carousel · Desktop: grid */}
        <div className="md:hidden -mx-4 px-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
          <div className="flex gap-4 pb-4">
            {testimonials.map((t, i) => (
              <TestimonialCard key={t.name} t={t} i={i} className="snap-center flex-shrink-0 w-[85vw] max-w-[340px]" />
            ))}
          </div>
        </div>

        <div className="hidden md:flex md:justify-center gap-5 max-w-6xl mx-auto">
          {testimonials.map((t, i) => (
            <TestimonialCard key={t.name} t={t} i={i} className="max-w-md w-full" />
          ))}
        </div>
      </div>
    </section>
  );
};

const TestimonialCard = ({
  t,
  i,
  className = "",
}: {
  t: (typeof testimonials)[0];
  i: number;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: i * 0.1 }}
    className={`relative rounded-3xl bg-background border border-border p-6 shadow-sm hover:shadow-xl transition-all overflow-hidden ${className}`}
  >
    <div className={`absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl bg-gradient-to-br ${t.gradient}`} />

    <div className="relative">
      <Quote className="w-6 h-6 text-accent/30 mb-3" />

      <p className="text-foreground/90 text-[15px] leading-relaxed mb-5 font-medium">
        “{t.quote}”
      </p>

      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 mb-5">
        <span className="text-xs font-bold text-accent">{t.metric}</span>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-border">
        <div className="w-11 h-11 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {t.initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground text-sm truncate">{t.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {t.salon} · {t.city}
          </p>
        </div>
        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
          <div className="flex">
            {[...Array(5)].map((_, idx) => (
              <Star key={idx} className="w-3 h-3 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground">desde {t.since}</span>
        </div>
      </div>
    </div>
  </motion.div>
);
