import { motion } from "framer-motion";
import { CalendarClock, BellRing, Globe, Wallet, Users, BarChart3 } from "lucide-react";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const VALUES = [
  {
    icon: CalendarClock,
    title: "Reservas 24/7",
    desc: "Tus clientes reservan solos, también a las tantas de la noche. Tú te despiertas con la agenda hecha.",
  },
  {
    icon: BellRing,
    title: "Menos plantones",
    desc: "Recordatorios automáticos por la app antes de cada cita. Menos huecos vacíos, menos dinero perdido.",
  },
  {
    icon: Globe,
    title: "Tu propia web",
    desc: "Una página profesional con tu nombre, tus servicios y tus fotos. Lista en minutos, sin saber de tecnología.",
  },
  {
    icon: Wallet,
    title: "Caja y cobros",
    desc: "Controla lo que entra cada día, cierra la caja y lleva las cuentas claras sin hojas de cálculo.",
  },
  {
    icon: Users,
    title: "Clientes y fichas",
    desc: "Historial de cada cliente, sus servicios y sus notas. Trato de tú a tú aunque tengas cientos.",
  },
  {
    icon: BarChart3,
    title: "Sabes cómo vas",
    desc: "Ingresos, servicios top y horas punta de un vistazo. Decide con datos, no a ojo.",
  },
];

export const ValueProps = () => {
  return (
    <section id="producto" className="relative scroll-mt-20 bg-background py-20 md:py-28">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: EASE_OUT }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-accent">
            Todo en un sitio
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Lo que antes te robaba el día,
            <br className="hidden sm:block" /> ahora lo hace la app.
          </h2>
        </motion.div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VALUES.map((v, i) => {
            const Icon = v.icon;
            return (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: Math.min(i * 0.06, 0.3), ease: EASE_OUT }}
                className="group relative rounded-3xl border border-border/60 bg-card p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1 hover:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.14)]"
              >
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg shadow-primary/20 transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105"
                  style={{ backgroundImage: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
                >
                  <Icon className="h-6 w-6" strokeWidth={2} />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{v.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
