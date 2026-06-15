import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, CalendarDays, Wallet, BarChart3 } from "lucide-react";
import panelInicio from "@/assets/panel-inicio.png";
import panelAgenda from "@/assets/panel-agenda.png";
import panelCaja from "@/assets/panel-caja.png";
import panelNegocio from "@/assets/panel-negocio.png";

const EASE = [0.22, 1, 0.36, 1] as const;

const TABS = [
  {
    id: "inicio",
    label: "Inicio",
    icon: LayoutDashboard,
    img: panelInicio,
    urlPath: "inicio",
    blurb: "Tu día de un vistazo: próxima cita, ingresos y ocupación en tiempo real.",
  },
  {
    id: "agenda",
    label: "Agenda",
    icon: CalendarDays,
    img: panelAgenda,
    urlPath: "agenda/dia",
    blurb: "Todos tus profesionales en una sola pantalla, sin solapamientos.",
  },
  {
    id: "caja",
    label: "Caja",
    icon: Wallet,
    img: panelCaja,
    urlPath: "caja",
    blurb: "Cobra en efectivo, tarjeta o Bizum. El cierre se hace solo.",
  },
  {
    id: "negocio",
    label: "Negocio",
    icon: BarChart3,
    img: panelNegocio,
    urlPath: "negocio",
    blurb: "Objetivos, ranking de equipo e insights del mes sin abrir un Excel.",
  },
];

export const PanelShowcase = () => {
  const [active, setActive] = useState(TABS[0]);

  return (
    <section id="producto" className="relative scroll-mt-20 overflow-hidden py-24 md:py-32">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[900px] -translate-x-1/2 opacity-40 blur-[120px]"
        style={{ background: "radial-gradient(circle, hsl(var(--primary)/0.18), hsl(var(--accent)/0.12), transparent 70%)" }}
        aria-hidden
      />

      <div className="container relative mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mx-auto mb-12 max-w-2xl text-center"
        >
          <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            El panel
          </span>
          <h2 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
            Tu negocio entero,{" "}
            <span
              className="font-serif italic"
              style={{
                background: "linear-gradient(100deg, hsl(var(--primary)), hsl(var(--accent)))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              en una pantalla.
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
            Cinco herramientas que antes eran cinco apps (o cinco libretas). Ahora, una.
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
          className="mb-8 flex flex-wrap justify-center gap-2"
        >
          {TABS.map((t) => {
            const Icon = t.icon;
            const on = active.id === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActive(t)}
                className={`group inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-[transform,background-color,color,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] ${
                  on
                    ? "text-white shadow-lg shadow-primary/25"
                    : "border border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
                style={on ? { backgroundImage: "linear-gradient(100deg, hsl(var(--primary)), hsl(var(--accent)))" } : undefined}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </motion.div>

        {/* Browser frame */}
        <motion.div
          initial={{ opacity: 0, y: 50, rotateX: 12, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, ease: EASE }}
          style={{ perspective: 1400 }}
          className="mx-auto max-w-5xl"
        >
          <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_50px_90px_-30px_rgba(20,22,48,0.4)]">
            {/* Chrome bar */}
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              <span className="mx-auto flex items-center gap-1.5 rounded-md bg-white px-3 py-1 text-[11px] text-slate-400 shadow-inner">
                glowapp.app/admin/{active.urlPath}
              </span>
            </div>

            {/* Screenshot */}
            <div className="relative w-full overflow-hidden bg-[#f6f7fb]">
              <AnimatePresence mode="wait">
                <motion.img
                  key={active.id}
                  src={active.img}
                  alt={`Panel Glowapp — ${active.label}`}
                  initial={{ opacity: 0, y: 10, scale: 0.995 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.995 }}
                  transition={{ duration: 0.28, ease: EASE }}
                  className="block w-full object-cover object-top"
                  draggable={false}
                />
              </AnimatePresence>
            </div>
          </div>

          {/* Caption */}
          <AnimatePresence mode="wait">
            <motion.p
              key={active.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="mx-auto mt-5 max-w-md text-center text-sm text-muted-foreground"
            >
              {active.blurb}
            </motion.p>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};
