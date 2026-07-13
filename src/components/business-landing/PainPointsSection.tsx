import { motion } from "framer-motion";
import { Notebook, MessageCircle, Star, Store } from "lucide-react";
import { EASE, washBg } from "./_landingShared";

/**
 * El problema. Cuatro dolores reales del salón antes de la solución. Grid 2×2
 * uniforme con tarjetas bordered (sin bento asimétrico, sin eyebrow, sin emoji),
 * sobre wash sutil de marca. Iconos lucide en azul de marca.
 */

const POINTS = [
  {
    Icon: Notebook,
    title: "La agenda en una libreta",
    desc: "O en notas del móvil. Un borrón y pierdes el hueco.",
  },
  {
    Icon: MessageCircle,
    title: "Las clientas por WhatsApp",
    desc: "Todo el día respondiendo «¿tenéis hueco?» mientras atiendes.",
  },
  {
    Icon: Star,
    title: "Las reseñas son de Booksy",
    desc: "No tuyas. Estás perdiendo clientas nuevas por ello.",
  },
  {
    Icon: Store,
    title: "Y tu marca es la de Booksy",
    desc: "Tus clientas son de su plataforma, no tuyas.",
  },
];

export const PainPointsSection = () => {
  return (
    <section className="relative scroll-mt-20 py-24 md:py-32" style={washBg}>
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mx-auto mb-14 max-w-2xl text-balance text-center text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl"
        >
          Tu salón vive en seis sitios{" "}
          <span className="text-muted-foreground">y en tu cabeza.</span>
        </motion.h2>

        <motion.div
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2"
        >
          {POINTS.map(({ Icon, title, desc }) => (
            <motion.div
              key={title}
              variants={{
                hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
                show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.55, ease: EASE } },
              }}
              className="group rounded-3xl border border-border bg-card/80 p-7 backdrop-blur-sm transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-20px_rgba(20,22,48,0.18)]"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mb-1.5 mt-5 text-lg font-bold tracking-tight text-foreground">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
