import { motion } from "framer-motion";
import { CalendarDays, Users, MessageCircle, Globe, Wallet, BarChart3 } from "lucide-react";
import { EASE } from "./_landingShared";

/**
 * «Un sistema entero. No una función suelta.» Grid de módulos en un ÚNICO
 * contenedor bordered con divisores internos (no tarjetas sueltas) — patrón que
 * lee como matriz de producto, no como galería. Sin eyebrow. 6 módulos reales
 * del ERP, con las funciones clave de cada uno.
 */

const MODULES = [
  {
    Icon: CalendarDays,
    title: "Agenda y citas",
    items: ["Reservas online 24/7", "Multi-profesional", "Citas recurrentes y bloqueos"],
  },
  {
    Icon: Users,
    title: "Clientas (CRM)",
    items: ["Ficha e historial", "Notas y tags VIP", "Exportar a CSV"],
  },
  {
    Icon: MessageCircle,
    title: "Marketing y WhatsApp",
    items: ["Kit de plantillas", "Recordatorios automáticos", "Broadcast a clientas"],
  },
  {
    Icon: Globe,
    title: "Web y app propia",
    items: ["Tu dominio, tu marca", "Tienda integrada", "SEO local en Google"],
  },
  {
    Icon: Wallet,
    title: "Caja",
    items: ["Cobro rápido con Stripe", "Cierre diario automático", "Informes PDF"],
  },
  {
    Icon: BarChart3,
    title: "Negocio y estadísticas",
    items: ["Ingresos en tiempo real", "Objetivos mensuales", "Retención de clientas"],
  },
];

export const FeatureGrid = () => {
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
          Un sistema entero.{" "}
          <span
            style={{
              background: "linear-gradient(100deg, hsl(var(--primary)), hsl(var(--accent)))",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            No una función suelta.
          </span>
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mx-auto grid max-w-5xl overflow-hidden rounded-[28px] border border-border bg-card/70 backdrop-blur-sm sm:grid-cols-2 lg:grid-cols-3"
        >
          {MODULES.map(({ Icon, title, items }) => (
            <div
              key={title}
              className="-mb-px -mr-px border-b border-r border-border p-7 transition-colors duration-300 hover:bg-primary/[0.03]"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mb-3 mt-4 text-base font-bold tracking-tight text-foreground">
                {title}
              </h3>
              <ul className="space-y-1.5">
                {items.map((it) => (
                  <li key={it} className="text-sm leading-relaxed text-muted-foreground">
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
