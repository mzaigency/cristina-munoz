import { motion } from "framer-motion";
import { SectionEyebrow } from "./SectionEyebrow";

const points = [
  {
    emoji: "📓",
    title: "La libreta tiene la última palabra",
    desc: "Y a veces miente. Cuando un cliente pregunta «¿tienes hueco?», ya has perdido 30 segundos buscando.",
    big: true,
  },
  { emoji: "📵", title: "WhatsApp a las 23:47", desc: "«Perdona, ¿mañana?». Y mañana ya está lleno." },
  { emoji: "🤷", title: "Doble reserva", desc: "Dos clientas a la misma hora. Una se va. Una no vuelve." },
  { emoji: "🧾", title: "Cierre de caja a ojo", desc: "¿Cuánto facturé hoy? Mañana lo miro." },
  { emoji: "📞", title: "Llamada con tijeras", desc: "O cuelgas a la clienta. O cuelgas el corte." },
];

export const PainPointsSection = () => {
  return (
    <section className="py-16 md:py-20 bg-secondary/50 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-12 max-w-2xl mx-auto"
        >
          <SectionEyebrow label="¿Te suena?" tone="destructive" />
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-3 mb-3 text-foreground">
            El día a día sin software
          </h2>
          <p className="text-muted-foreground">
            Si gestionas tu salón con libreta y WhatsApp, no es que trabajes mal.
            Es que el sistema está roto.
          </p>
        </motion.div>

        {/* Bento grid: mobile stack, md+ asymmetric */}
        <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-3 md:gap-4 max-w-5xl mx-auto">
          {points.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className={`group relative rounded-3xl bg-background border border-border p-6 hover:border-destructive/30 hover:shadow-lg transition-all duration-300 overflow-hidden ${
                p.big ? "md:col-span-2 md:row-span-2 md:p-8" : ""
              }`}
            >
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-destructive/5 blur-2xl group-hover:bg-destructive/10 transition-colors" />
              <div className="relative">
                <div className={`mb-4 ${p.big ? "text-6xl md:text-7xl" : "text-4xl"}`}>
                  {p.emoji}
                </div>
                <h3
                  className={`font-bold text-foreground mb-2 ${
                    p.big ? "text-xl md:text-2xl" : "text-base"
                  }`}
                >
                  {p.title}
                </h3>
                <p
                  className={`text-muted-foreground leading-relaxed ${
                    p.big ? "text-base" : "text-sm"
                  }`}
                >
                  {p.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
