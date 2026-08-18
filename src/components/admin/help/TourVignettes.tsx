import { motion, useReducedMotion } from "motion/react";
import { Check, Star, Sparkles, CalendarDays, Users, Wallet, Home, Scissors } from "lucide-react";

/**
 * Viñetas animadas del tour del panel: mini-demos visuales que enseñan la
 * acción (crear cita, cobrar, VIP, reserva online) sin tocar la UI real.
 * Todas son fluidas: ancho 100%, altura fija del contenedor padre.
 * Con prefers-reduced-motion los bucles se congelan en su estado final.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

function Scene({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-muted/70 via-background to-muted/40">
      {children}
    </div>
  );
}

/* ── 1. Panorama del panel ─────────────────────────────────────────── */
export function VignettePanel() {
  const reduced = useReducedMotion();
  const icons = [Home, CalendarDays, Wallet, Users];

  return (
    <Scene>
      <div className="absolute inset-4 flex gap-3">
        {/* Mini sidebar */}
        <div className="relative flex w-10 flex-col items-center gap-2 rounded-xl bg-card py-2 shadow-sm ring-1 ring-border/60">
          {!reduced && (
            <motion.div
              aria-hidden
              className="absolute left-1.5 right-1.5 h-8 rounded-lg bg-primary/15"
              animate={{ y: [0, 36, 72, 108, 0] }}
              transition={{ duration: 6, times: [0, 0.25, 0.5, 0.75, 1], repeat: Infinity, ease: "easeInOut" }}
              style={{ top: 8 }}
            />
          )}
          {icons.map((Icon, i) => (
            <div key={i} className="relative z-10 flex h-8 w-8 items-center justify-center text-muted-foreground">
              <Icon className="h-4 w-4" />
            </div>
          ))}
        </div>
        {/* Contenido: tarjetas en cascada */}
        <div className="flex flex-1 flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="flex-1 rounded-xl bg-card shadow-sm ring-1 ring-border/60 px-3 py-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.12, duration: 0.45, ease: EASE }}
            >
              <div className="h-2 w-1/3 rounded-full bg-muted-foreground/25" />
              <div className="mt-1.5 h-2 w-2/3 rounded-full bg-muted-foreground/15" />
            </motion.div>
          ))}
        </div>
      </div>
    </Scene>
  );
}

/* ── 2. Agenda: cita que se crea y se arrastra ─────────────────────── */
export function VignetteAgenda() {
  const reduced = useReducedMotion();

  return (
    <Scene>
      <div className="absolute inset-4 flex flex-col justify-between">
        {["10:00", "11:00", "12:00"].map((h) => (
          <div key={h} className="flex items-center gap-2">
            <span className="w-9 text-[10px] font-medium tabular-nums text-muted-foreground">{h}</span>
            <div className="h-px flex-1 bg-border" />
          </div>
        ))}
      </div>
      {/* Bloque de cita: cae en las 10:00 y se arrastra a las 12:00 */}
      <motion.div
        className="absolute left-[72px] right-6 h-9 rounded-lg bg-primary/90 px-2.5 py-1.5 shadow-lg shadow-primary/25"
        initial={false}
        animate={
          reduced
            ? { top: "58%", opacity: 1, scale: 1 }
            : {
                top: ["6%", "14%", "14%", "58%", "58%", "6%"],
                opacity: [0, 1, 1, 1, 1, 0],
                scale: [0.9, 1, 1.05, 1, 1, 0.9],
              }
        }
        transition={{ duration: 5, times: [0, 0.12, 0.4, 0.62, 0.92, 1], repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="h-1.5 w-16 rounded-full bg-white/85" />
        <div className="mt-1 h-1.5 w-10 rounded-full bg-white/50" />
      </motion.div>
      {/* Check al soltar */}
      {!reduced && (
        <motion.div
          className="absolute right-7 top-[56%] flex h-6 w-6 items-center justify-center rounded-full bg-[var(--gp-ok)] text-white shadow"
          animate={{ scale: [0, 0, 1, 1, 0], opacity: [0, 0, 1, 1, 0] }}
          transition={{ duration: 5, times: [0, 0.62, 0.7, 0.9, 1], repeat: Infinity }}
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </motion.div>
      )}
    </Scene>
  );
}

/* ── 3. Caja: ticket y cobro ───────────────────────────────────────── */
export function VignetteCaja() {
  const reduced = useReducedMotion();

  return (
    <Scene>
      <div className="absolute inset-x-0 top-1/2 mx-auto w-[72%] max-w-[240px] -translate-y-1/2 rounded-xl bg-card p-3 shadow-md ring-1 ring-border/60">
        {[
          ["Corte + peinado", "18,00 €"],
          ["Color raíz", "16,50 €"],
        ].map(([name, price], i) => (
          <div key={i} className="flex items-center justify-between py-0.5">
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Scissors className="h-3 w-3" /> {name}
            </span>
            <span className="text-[11px] font-medium tabular-nums">{price}</span>
          </div>
        ))}
        <div className="my-1.5 border-t border-dashed border-border" />
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold">Total</span>
          <motion.span
            className="text-sm font-bold tabular-nums gp-text-brand"
            initial={false}
            animate={reduced ? { scale: 1 } : { scale: [1, 1, 1.18, 1] }}
            transition={{ duration: 3.6, times: [0, 0.55, 0.65, 0.75], repeat: Infinity }}
          >
            34,50 €
          </motion.span>
        </div>
        <div className="mt-2 flex gap-1.5">
          <div className="flex-1 rounded-md bg-muted py-1 text-center text-[10px] font-medium text-muted-foreground">
            Efectivo
          </div>
          <motion.div
            className="relative flex-1 rounded-md bg-primary py-1 text-center text-[10px] font-semibold text-primary-foreground"
            initial={false}
            animate={reduced ? { scale: 1 } : { scale: [1, 1, 0.94, 1] }}
            transition={{ duration: 3.6, times: [0, 0.5, 0.56, 0.62], repeat: Infinity }}
          >
            Tarjeta
            {!reduced && (
              <motion.span
                aria-hidden
                className="absolute inset-0 rounded-md ring-2 ring-primary"
                animate={{ opacity: [0, 0, 0.8, 0], scale: [1, 1, 1.15, 1.3] }}
                transition={{ duration: 3.6, times: [0, 0.5, 0.6, 0.75], repeat: Infinity }}
              />
            )}
          </motion.div>
        </div>
      </div>
      {/* Check de cobro completado */}
      <motion.div
        className="absolute right-[12%] top-[14%] flex h-8 w-8 items-center justify-center rounded-full bg-[var(--gp-ok)] text-white shadow-lg"
        initial={false}
        animate={reduced ? { scale: 1, opacity: 1 } : { scale: [0, 0, 1, 1, 0], opacity: [0, 0, 1, 1, 0] }}
        transition={{ duration: 3.6, times: [0, 0.68, 0.78, 0.94, 1], repeat: Infinity }}
      >
        <Check className="h-4 w-4" strokeWidth={3} />
      </motion.div>
    </Scene>
  );
}

/* ── 4. Clientes: ficha con historial y VIP ────────────────────────── */
export function VignetteClientes() {
  const reduced = useReducedMotion();

  return (
    <Scene>
      <div className="absolute inset-x-0 top-1/2 mx-auto w-[76%] max-w-[260px] -translate-y-1/2 rounded-xl bg-card p-3 shadow-md ring-1 ring-border/60">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
            M
          </div>
          <div className="flex-1">
            <div className="h-2 w-20 rounded-full bg-muted-foreground/30" />
            <div className="mt-1 h-2 w-14 rounded-full bg-muted-foreground/15" />
          </div>
          {/* Badge VIP */}
          <motion.div
            className="flex items-center gap-1 rounded-full bg-[var(--gp-warn-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--gp-warn-ink)]  "
            initial={false}
            animate={
              reduced
                ? { scale: 1, opacity: 1, rotate: 0 }
                : { scale: [0, 0, 0, 1.2, 1, 1], opacity: [0, 0, 0, 1, 1, 1], rotate: [-12, -12, -12, 4, 0, 0] }
            }
            transition={{ duration: 4.4, times: [0, 0.45, 0.5, 0.58, 0.64, 1], repeat: Infinity, repeatDelay: 0.6 }}
          >
            <Star className="h-2.5 w-2.5 fill-current" />
            VIP
          </motion.div>
        </div>
        <div className="mt-2.5 space-y-1.5">
          {["Corte · hace 2 sem", "Color · hace 1 mes", "Tratamiento · hace 2 meses"].map((row, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
              initial={false}
              animate={reduced ? { opacity: 1, x: 0 } : { opacity: [0, 1, 1], x: [-8, 0, 0] }}
              transition={{
                duration: 4.4,
                times: [0.08 + i * 0.1, 0.16 + i * 0.1, 1],
                repeat: Infinity,
                repeatDelay: 0.6,
              }}
            >
              <Check className="h-2.5 w-2.5 text-[var(--gp-ok)]" strokeWidth={3} />
              {row}
            </motion.div>
          ))}
        </div>
      </div>
    </Scene>
  );
}

/* ── 5. Tu web: reserva online que entra sola ──────────────────────── */
export function VignetteWeb() {
  const reduced = useReducedMotion();

  return (
    <Scene>
      {/* Mini móvil con tu landing */}
      <div className="absolute left-[14%] top-1/2 h-[82%] w-[88px] -translate-y-1/2 rounded-2xl border-2 border-foreground/15 bg-card p-1.5 shadow-lg">
        <div className="h-1/2 rounded-lg gp-grad-brand opacity-80" />
        <div className="mx-auto mt-1.5 h-1.5 w-3/4 rounded-full bg-muted-foreground/25" />
        <div className="mx-auto mt-1 h-1.5 w-1/2 rounded-full bg-muted-foreground/15" />
        <motion.div
          className="mx-auto mt-2 w-[85%] rounded-md bg-primary py-1 text-center text-[8px] font-bold text-primary-foreground"
          initial={false}
          animate={reduced ? { scale: 1 } : { scale: [1, 1, 0.92, 1] }}
          transition={{ duration: 4.2, times: [0, 0.28, 0.34, 0.4], repeat: Infinity }}
        >
          Reservar
        </motion.div>
      </div>
      {/* Notificación entrando en tu panel */}
      <motion.div
        className="absolute right-[8%] top-[28%] w-[46%] max-w-[200px] rounded-xl bg-card p-2.5 shadow-lg ring-1 ring-border/60"
        initial={false}
        animate={
          reduced
            ? { x: 0, opacity: 1 }
            : { x: [60, 0, 0, 60], opacity: [0, 1, 1, 0] }
        }
        transition={{ duration: 4.2, times: [0.42, 0.52, 0.9, 1], repeat: Infinity, ease: "easeOut" }}
      >
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-foreground">
          <Sparkles className="h-3 w-3 gp-text-brand" />
          Nueva cita
        </div>
        <div className="mt-1 text-[10px] text-muted-foreground">María · mañana 10:00</div>
      </motion.div>
      {/* Línea de conexión */}
      {!reduced && (
        <motion.div
          aria-hidden
          className="absolute left-[38%] top-[46%] h-0.5 w-[18%] origin-left rounded-full bg-primary/40"
          animate={{ scaleX: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 4.2, times: [0.34, 0.46, 0.88, 1], repeat: Infinity }}
        />
      )}
    </Scene>
  );
}
