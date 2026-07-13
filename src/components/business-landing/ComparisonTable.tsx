import { motion } from "framer-motion";
import { Check, Minus } from "lucide-react";
import { EASE } from "./_landingShared";

/**
 * «Ellos alquilan tus clientas. Glowapp te las da.» — sección de diferenciación
 * vs marketplaces (Booksy / Fresha), como tabla limpia (patrón Zentro). NO va
 * en el bloque de precio. Claims verificados 2026: nunca afirmar «comisión por
 * reserva» a secas — Booksy Boost es 30% de la 1ª visita de clientas nuevas del
 * marketplace; Fresha 20% de la 1ª cita de clientas nuevas del marketplace.
 * Columna Glowapp destacada con tinte de marca; rival en gris apagado.
 */

const ROWS: { label: string; glow: string; rival: string }[] = [
  { label: "Web y app con tu dominio", glow: "Incluida, tu marca", rival: "No, perfil en su plataforma" },
  { label: "Comisión por clienta nueva", glow: "0 %, siempre", rival: "Hasta 20–30 % de la 1ª visita" },
  { label: "Capa social (feed y stories)", glow: "Sí, como Instagram", rival: "No" },
  { label: "Tus clientas son…", glow: "Tuyas", rival: "Del marketplace" },
  { label: "Soporte en español", glow: "WhatsApp humano", rival: "Chat o en inglés" },
  { label: "Primer mes", glow: "Gratis, sin cargo", rival: "Cuota desde el inicio" },
];

export const ComparisonTable = () => {
  return (
    <section className="relative scroll-mt-20 py-24 md:py-32">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mx-auto mb-14 max-w-2xl text-balance text-center text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl"
        >
          Ellos alquilan tus clientas.{" "}
          <span
            style={{
              background: "linear-gradient(100deg, hsl(var(--primary)), hsl(var(--accent)))",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Glowapp te las da.
          </span>
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mx-auto max-w-4xl overflow-hidden rounded-[28px] border border-border bg-card/70 backdrop-blur-sm"
        >
          {/* Cabecera */}
          <div className="grid grid-cols-[1.3fr_1fr_1fr] border-b border-border">
            <div className="p-4 sm:p-5" />
            <div
              className="p-4 text-center text-sm font-bold text-white sm:p-5"
              style={{ backgroundImage: "linear-gradient(100deg, hsl(var(--primary)), hsl(var(--accent)))" }}
            >
              Glowapp
            </div>
            <div className="p-4 text-center text-sm font-semibold text-muted-foreground sm:p-5">
              Booksy / Fresha
            </div>
          </div>

          {/* Filas */}
          {ROWS.map((r, i) => (
            <motion.div
              key={r.label}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: EASE, delay: i * 0.05 }}
              className="grid grid-cols-[1.3fr_1fr_1fr] border-b border-border last:border-b-0"
            >
              <div className="flex items-center p-4 text-sm font-medium text-foreground sm:p-5">
                {r.label}
              </div>
              <div className="flex items-center justify-center gap-2 bg-primary/[0.04] p-4 text-center text-sm font-semibold text-foreground sm:p-5">
                <Check className="hidden h-4 w-4 flex-none text-emerald-500 sm:block" strokeWidth={3} />
                {r.glow}
              </div>
              <div className="flex items-center justify-center gap-2 p-4 text-center text-sm text-muted-foreground sm:p-5">
                <Minus className="hidden h-4 w-4 flex-none text-muted-foreground/50 sm:block" />
                {r.rival}
              </div>
            </motion.div>
          ))}
        </motion.div>

        <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-muted-foreground/70">
          Datos verificados 2026. Booksy y Fresha no cobran comisión por tus reservas propias; la comisión
          aplica a clientas nuevas que llegan desde su marketplace (Booksy Boost, Fresha).
        </p>
      </div>
    </section>
  );
};
