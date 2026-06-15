import { motion } from "framer-motion";
import { NotebookPen, PhoneCall, CalendarX2, ArrowDown } from "lucide-react";
import { EASE, Eyebrow } from "./_landingShared";

/**
 * Sección de agitación del problema. Nombra el dolor real del día a día del
 * salón ANTES de presentar la solución (estructura que usan Booksy y Treatwell).
 * Tres frustraciones con voz de dueña + puente a la solución.
 */

const PAINS = [
  {
    Icon: NotebookPen,
    title: "La libreta y el WhatsApp",
    body: "Apuntas citas en papel y confirmas por WhatsApp a las once de la noche. Un borrón y pierdes el hueco.",
    tag: "Caos diario",
  },
  {
    Icon: PhoneCall,
    title: "El teléfono no para",
    body: "Suena mientras tienes las manos en un tinte. O lo coges y dejas al cliente, o lo ignoras y pierdes la reserva.",
    tag: "Interrupciones",
  },
  {
    Icon: CalendarX2,
    title: "Los plantones",
    body: "Reservan, no aparecen, y ese hueco ya no vuelve. Cada falta sin avisar es dinero que se va de tu caja.",
    tag: "Dinero perdido",
  },
];

const card = {
  hidden: { opacity: 0, y: 40, rotateX: 12, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    scale: 1,
    transition: { type: "spring" as const, duration: 0.75, bounce: 0.22 },
  },
};

export const ProblemAgitation = () => {
  return (
    <section className="relative scroll-mt-20 py-24 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <Eyebrow>El problema</Eyebrow>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: EASE }}
            className="text-balance text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl"
          >
            Gestionar un salón a mano{" "}
            <span className="font-serif italic text-destructive">cansa.</span>
            <br className="hidden sm:block" /> Y te cuesta dinero.
          </motion.h2>
        </div>

        <motion.div
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.14 } } }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          style={{ perspective: 1200 }}
          className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3"
        >
          {PAINS.map(({ Icon, title, body, tag }) => (
            <motion.div
              key={title}
              variants={card}
              className="group relative overflow-hidden rounded-3xl border border-destructive/15 bg-card/80 p-7 shadow-sm backdrop-blur-sm"
            >
              {/* halo rojo tenue que se desvanece */}
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-40 blur-2xl transition-opacity duration-500 group-hover:opacity-70"
                style={{ background: "radial-gradient(circle, hsl(var(--destructive)/0.25), transparent 70%)" }}
              />
              <div className="relative">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="mt-5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-destructive/70">
                  {tag}
                </span>
                <h3 className="mb-2 mt-1.5 text-xl font-bold tracking-tight text-foreground">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Puente a la solución */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
          className="mt-14 flex flex-col items-center gap-4 text-center"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <motion.span
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowDown className="h-5 w-5" />
            </motion.span>
          </span>
          <p className="max-w-md text-lg font-medium text-foreground">
            Glowapp se encarga de las tres.{" "}
            <span className="text-muted-foreground">Tú solo trabajas.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
};
