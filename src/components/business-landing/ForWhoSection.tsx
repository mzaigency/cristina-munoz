import { motion } from "framer-motion";
import { Scissors, Sparkles } from "lucide-react";
import { SectionEyebrow } from "./SectionEyebrow";

const profiles = [
  {
    emoji: "💇‍♀️",
    title: "Peluquerías",
    pain: "Llamadas mientras tienes las manos llenas de tinte.",
    win: "Reservas automáticas que no interrumpen el servicio.",
    accent: "from-primary/20 to-primary/5",
  },
  {
    emoji: "💈",
    title: "Barberías",
    pain: "Walk-ins sin control y agenda saturada los sábados.",
    win: "Cola virtual y bloqueos por barbero, sin caos.",
    accent: "from-accent/20 to-accent/5",
  },
  {
    emoji: "💅",
    title: "Estética y uñas",
    pain: "Servicios largos donde un hueco vacío duele de verdad.",
    win: "Recordatorios y lista de espera para llenarlo en minutos.",
    accent: "from-primary/15 to-accent/15",
  },
];

export const ForWhoSection = () => {
  return (
    <section className="py-16 md:py-20 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-14"
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Hecho para ti
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-3 mb-3 text-foreground">
            Hablamos tu idioma
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Da igual si llevas 20 años con la tijera o acabas de abrir tu cabina. GlowApp se adapta a cómo trabajas.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
          {profiles.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative rounded-3xl border border-border bg-card p-6 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              <div
                className={`absolute -top-12 -right-12 w-40 h-40 rounded-full blur-2xl bg-gradient-to-br ${p.accent} opacity-60 group-hover:opacity-100 transition-opacity`}
              />
              <div className="relative">
                <div className="text-5xl mb-4">{p.emoji}</div>
                <h3 className="text-xl font-bold text-foreground mb-3">{p.title}</h3>

                <div className="space-y-3">
                  <div className="flex gap-2.5">
                    <span className="flex-shrink-0 mt-1 w-1 h-1 rounded-full bg-destructive/60" />
                    <p className="text-sm text-muted-foreground line-through decoration-destructive/40 leading-relaxed">
                      {p.pain}
                    </p>
                  </div>
                  <div className="flex gap-2.5">
                    <Scissors className="flex-shrink-0 mt-0.5 w-4 h-4 text-accent" />
                    <p className="text-sm text-foreground font-medium leading-relaxed">{p.win}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
