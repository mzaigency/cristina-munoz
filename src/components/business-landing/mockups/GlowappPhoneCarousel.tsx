import { useState, CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, Wallet, Calendar, CheckCircle2, Plus, TrendingUp, Star, Scissors } from "lucide-react";

// Radio del anillo (debe coincidir con el cálculo del timeline en CinematicHero)
export const RING_R = 64;
export const RING_C = 2 * Math.PI * RING_R;
export const RING_PCT = 0.82;

/**
 * Carrusel de pantallas del iPhone del hero. Las pantallas usan el design
 * system REAL del panel (`.gp-shell` + clases/tokens `gp-*`, claro, accent
 * #22408b) en layout móvil forzado (una columna) para que sean fieles al panel
 * real. El anillo de reservas de la pantalla Inicio se rellena con el scroll
 * (motion value que llega desde el hero cinemático).
 */

const EASE = [0.22, 1, 0.36, 1] as const;

// Shell gp- en modo móvil forzado (una columna), tamaño teléfono.
const gpPhone: CSSProperties = {
  height: "100%",
  width: "100%",
  display: "block",
  overflow: "hidden",
  background: "var(--gp-bg)",
  padding: "42px 14px 28px",
};

/* ---------- Pantalla INICIO: anillo de reservas (lo rellena el scroll vía
   gsap, que pone strokeDashoffset en .ch-res-ring y el texto en .ch-res-count) ---------- */
function ScreenInicio() {
  return (
    <div className="gp-shell" style={gpPhone}>
      <div className="gp-page-h" style={{ marginBottom: 14 }}>
        <div>
          <h2 style={{ fontSize: 17 }}>Resumen del día</h2>
          <p style={{ fontSize: 11 }}>martes 14 de junio</p>
        </div>
      </div>

      {/* Anillo de reservas (estilo OccRing real) */}
      <div style={{ position: "relative", width: 152, height: 152, margin: "4px auto 16px" }}>
        <svg width={152} height={152} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={76} cy={76} r={RING_R} fill="none" stroke="var(--gp-chip)" strokeWidth={12} />
          <circle className="ch-res-ring" cx={76} cy={76} r={RING_R} fill="none" stroke="var(--gp-accent)" strokeWidth={12} strokeLinecap="round" strokeDasharray={RING_C} strokeDashoffset={RING_C} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span className="ch-res-count" style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-.03em", color: "var(--gp-ink)" }}>0</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--gp-muted-c)" }}>reservas este mes</span>
        </div>
      </div>

      {/* Próxima cita (gp- real) */}
      <div className="gp-card" style={{ overflow: "hidden", position: "relative", marginBottom: 10 }}>
        <div className="gp-next-bg" />
        <div className="gp-next-inner" style={{ padding: 12 }}>
          <div className="gp-next-text">
            <span className="gp-badge accent" style={{ marginBottom: 6, display: "inline-flex" }}><Clock style={{ width: 11, height: 11 }} /> Próxima</span>
            <div className="gp-next-row">
              <span className="gp-next-time" style={{ fontSize: 24 }}>17:30</span>
              <div className="gp-next-meta">
                <div className="gp-next-name" style={{ fontSize: 13 }}>María López</div>
                <div className="gp-next-sub">Corte + color</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div className="gp-kpi" style={{ padding: 12 }}>
          <div className="gp-kpi-top" style={{ marginBottom: 8 }}>
            <span className="gp-kpi-ic" style={{ width: 30, height: 30, background: "var(--gp-accent-soft)", color: "var(--gp-accent)" }}><Wallet style={{ width: 15, height: 15 }} /></span>
            <span className="gp-kpi-delta up"><TrendingUp style={{ width: 10, height: 10 }} />+18%</span>
          </div>
          <div className="gp-kpi-val" style={{ fontSize: 19 }}>420 €</div>
          <div className="gp-kpi-lbl" style={{ fontSize: 11 }}>Ingresos hoy</div>
        </div>
        <div className="gp-kpi" style={{ padding: 12 }}>
          <div className="gp-kpi-top" style={{ marginBottom: 8 }}>
            <span className="gp-kpi-ic" style={{ width: 30, height: 30, background: "var(--gp-info-soft)", color: "var(--gp-info)" }}><Calendar style={{ width: 15, height: 15 }} /></span>
          </div>
          <div className="gp-kpi-val" style={{ fontSize: 19 }}>8</div>
          <div className="gp-kpi-lbl" style={{ fontSize: 11 }}>Citas hoy</div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Pantalla AGENDA (gp- real) ---------- */
const AG = [
  { t: "10:00", n: "María L.", s: "Corte + color", c: "var(--gp-accent)" },
  { t: "11:30", n: "Ana P.", s: "Peinado", c: "var(--gp-purple)" },
  { t: "13:00", n: "Carmen", s: "Mechas", c: "var(--gp-info)" },
  { t: "17:30", n: "Sofía", s: "Manicura", c: "var(--gp-ok)" },
];
function ScreenAgenda({ active }: { active: boolean }) {
  return (
    <div className="gp-shell" style={gpPhone}>
      <div className="gp-page-h" style={{ marginBottom: 12 }}>
        <div><h2 style={{ fontSize: 17 }}>Agenda</h2><p style={{ fontSize: 11 }}>8 citas hoy</p></div>
        <button className="gp-btn primary sm"><Plus style={{ width: 12, height: 12 }} /></button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {AG.map((a, i) => (
          <motion.div key={a.t} className="gp-card" style={{ display: "flex", alignItems: "center", gap: 10, padding: 11 }} initial={{ opacity: 0, x: 18 }} animate={active ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.15 + i * 0.09, ease: EASE }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "var(--gp-muted-c)", fontVariantNumeric: "tabular-nums" }}>{a.t}</span>
            <span style={{ width: 4, height: 30, borderRadius: 99, background: a.c }} />
            <div><div style={{ fontSize: 13, fontWeight: 700, color: "var(--gp-ink)" }}>{a.n}</div><div style={{ fontSize: 11, color: "var(--gp-muted-c)" }}>{a.s}</div></div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Pantalla CAJA (gp- real) ---------- */
function ScreenCaja({ active }: { active: boolean }) {
  const rows = [
    { m: "Efectivo", v: "150 €", w: 0.36, c: "var(--gp-ok)" },
    { m: "Tarjeta", v: "245 €", w: 0.58, c: "var(--gp-accent)" },
    { m: "Bizum", v: "25 €", w: 0.06, c: "var(--gp-purple)" },
  ];
  return (
    <div className="gp-shell" style={gpPhone}>
      <div className="gp-page-h" style={{ marginBottom: 12 }}>
        <div><h2 style={{ fontSize: 17 }}>Caja</h2><p style={{ fontSize: 11 }}>Cierre de hoy</p></div>
      </div>
      <div className="gp-kpi" style={{ padding: 14, marginBottom: 12 }}>
        <div className="gp-kpi-lbl" style={{ fontSize: 11, marginTop: 0, marginBottom: 4 }}>Total del día</div>
        <div className="gp-kpi-val" style={{ fontSize: 30 }}>420,00 €</div>
      </div>
      <div className="gp-card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 13 }}>
        {rows.map((r, i) => (
          <div key={r.m}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}><span style={{ color: "var(--gp-ink2)", fontWeight: 600 }}>{r.m}</span><span style={{ fontWeight: 800, color: "var(--gp-ink)" }}>{r.v}</span></div>
            <div style={{ height: 7, borderRadius: 99, background: "var(--gp-chip)", overflow: "hidden" }}>
              <motion.div style={{ height: "100%", borderRadius: 99, background: r.c }} initial={{ width: 0 }} animate={active ? { width: `${r.w * 100}%` } : {}} transition={{ delay: 0.25 + i * 0.12, duration: 0.9, ease: EASE }} />
            </div>
          </div>
        ))}
      </div>
      <button className="gp-btn primary" style={{ width: "100%", marginTop: 12, justifyContent: "center" }}><CheckCircle2 style={{ width: 14, height: 14 }} /> Cerrar caja</button>
    </div>
  );
}

/* ---------- Pantalla WEB (landing tenant real) ---------- */
function ScreenWeb() {
  const svc = [{ n: "Corte + peinado", p: "25 €" }, { n: "Color completo", p: "55 €" }, { n: "Mechas balayage", p: "80 €" }];
  return (
    <div className="flex h-full flex-col bg-white pt-9 text-slate-900">
      <div className="relative h-32 shrink-0 overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(150deg, hsl(var(--primary)), hsl(var(--accent)))" }} />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-3 left-4 right-4 text-white">
          <p className="font-serif text-xl italic leading-none">Cristina Muñoz</p>
          <div className="mt-1 flex items-center gap-2 text-[10px] text-white/85"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> 4,9 · Madrid</div>
        </div>
      </div>
      <div className="flex-1 space-y-2 p-4">
        <p className="flex items-center gap-1.5 text-xs font-bold"><Scissors className="h-3.5 w-3.5 text-primary" /> Servicios</p>
        {svc.map((s) => (
          <div key={s.n} className="flex items-center justify-between rounded-xl border border-slate-200 bg-card p-2.5 shadow-sm">
            <span className="text-[12px] font-semibold">{s.n}</span>
            <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-bold">{s.p}</span>
          </div>
        ))}
        <button className="mt-1 w-full rounded-xl py-2.5 text-xs font-bold text-white" style={{ backgroundImage: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}>Reservar cita</button>
      </div>
    </div>
  );
}

export function GlowappPhoneCarousel() {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);

  const screens = [
    { id: "inicio", el: <ScreenInicio /> },
    { id: "agenda", el: <ScreenAgenda active /> },
    { id: "caja", el: <ScreenCaja active /> },
    { id: "web", el: <ScreenWeb /> },
  ];
  const go = (d: number) => { setDir(d); setIdx((i) => (i + d + screens.length) % screens.length); };

  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 overflow-hidden bg-[var(--gp-bg,#f6f7fb)]">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={screens[idx].id}
            custom={dir}
            variants={{
              initial: (d: number) => ({ opacity: 0, x: d * 36 }),
              animate: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: -d * 36 }),
            }}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.35, ease: EASE }}
            className="absolute inset-0"
          >
            {screens[idx].el}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots */}
      <div className="absolute bottom-2.5 left-1/2 z-30 flex -translate-x-1/2 gap-1.5">
        {screens.map((s, i) => (
          <button key={s.id} onClick={() => { setDir(i > idx ? 1 : -1); setIdx(i); }} className="h-1.5 rounded-full transition-all duration-300" style={{ width: i === idx ? 16 : 6, background: i === idx ? "hsl(var(--accent))" : "rgba(20,22,48,0.2)" }} aria-label={s.id} />
        ))}
      </div>

      {/* Flechas */}
      <button onClick={() => go(-1)} className="absolute left-1.5 top-1/2 z-40 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/80 text-slate-700 shadow-md backdrop-blur-md transition hover:bg-white active:scale-95" aria-label="Anterior"><ChevronLeft className="h-4 w-4" /></button>
      <button onClick={() => go(1)} className="absolute right-1.5 top-1/2 z-40 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/80 text-slate-700 shadow-md backdrop-blur-md transition hover:bg-white active:scale-95" aria-label="Siguiente"><ChevronRight className="h-4 w-4" /></button>
    </div>
  );
}
