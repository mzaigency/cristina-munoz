import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, Wallet, Star, Scissors, ArrowRight } from "lucide-react";

/**
 * Carrusel de pantallas de la app Glowapp para el iPhone del hero cinemático.
 * Estilo "app screen" oscura (como el template Sobers): anillo de progreso
 * animado con contador, widgets en stagger, y varias pantallas (Inicio /
 * Agenda / Caja / Web) navegables con flechas. Motion graphics continuos.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

/* Contador que sube cuando `run` es true */
function CountUp({ to, run, suffix = "", duration = 1400 }: { to: number; run: boolean; suffix?: string; duration?: number }) {
  const [val, setVal] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    if (!run) { setVal(0); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * to));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [run, to, duration]);
  return <>{val.toLocaleString("es-ES")}{suffix}</>;
}

const widgetCls = "rounded-2xl border border-white/10 bg-white/[0.05] p-3 shadow-[0_8px_20px_rgba(0,0,0,0.3)]";

/* ---------- Pantalla INICIO (anillo animado) ---------- */
function ScreenInicio({ active }: { active: boolean }) {
  const R = 66, C = 2 * Math.PI * R, pct = 0.82;
  return (
    <div className="flex h-full flex-col px-5 pb-6 pt-12 text-white">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-200/50">Hoy · martes</p>
          <p className="text-lg font-bold tracking-tight">Tu salón</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-xs font-bold">CM</div>
      </div>

      {/* Anillo */}
      <div className="relative mx-auto mb-7 flex h-44 w-44 items-center justify-center drop-shadow-[0_15px_25px_rgba(0,0,0,0.6)]">
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
          <motion.circle
            cx="80" cy="80" r={R} fill="none" stroke="url(#ringGrad)" strokeWidth="12" strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: active ? C * (1 - pct) : C }}
            transition={{ duration: 1.6, ease: EASE }}
          />
          <defs>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--accent))" />
            </linearGradient>
          </defs>
        </svg>
        <div className="z-10 flex flex-col items-center">
          <span className="text-4xl font-extrabold tracking-tighter"><CountUp to={127} run={active} /></span>
          <span className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-blue-200/50">reservas este mes</span>
        </div>
      </div>

      {/* Widgets */}
      <div className="space-y-3">
        <motion.div className={widgetCls} initial={{ opacity: 0, y: 18 }} animate={active ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.5, type: "spring", bounce: 0.3 }}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/15"><Clock className="h-4 w-4 text-blue-300" /></div>
            <div className="flex-1">
              <p className="text-[10px] text-blue-200/50">Próxima cita · 17:30</p>
              <p className="text-sm font-bold">María López</p>
            </div>
            <ArrowRight className="h-4 w-4 text-white/30" />
          </div>
        </motion.div>
        <motion.div className={widgetCls} initial={{ opacity: 0, y: 18 }} animate={active ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.65, type: "spring", bounce: 0.3 }}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-500/15"><Wallet className="h-4 w-4 text-emerald-300" /></div>
            <div className="flex-1">
              <p className="text-[10px] text-blue-200/50">Ingresos de hoy</p>
              <p className="text-sm font-bold">420,00 €</p>
            </div>
            <span className="text-[11px] font-bold text-emerald-400">+18%</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ---------- Pantalla AGENDA ---------- */
const AG = [
  { t: "10:00", n: "María L.", s: "Corte + color", c: "hsl(var(--primary))" },
  { t: "11:30", n: "Ana P.", s: "Peinado", c: "hsl(var(--accent))" },
  { t: "13:00", n: "Carmen", s: "Mechas", c: "#3b82f6" },
  { t: "17:30", n: "Sofía", s: "Manicura", c: "#10b981" },
];
function ScreenAgenda({ active }: { active: boolean }) {
  return (
    <div className="flex h-full flex-col px-5 pb-6 pt-12 text-white">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-200/50">Agenda · hoy</p>
      <p className="mb-5 text-lg font-bold tracking-tight">8 citas</p>
      <div className="space-y-2.5">
        {AG.map((a, i) => (
          <motion.div key={a.t} className={widgetCls + " flex items-center gap-3"} initial={{ opacity: 0, x: 20 }} animate={active ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.2 + i * 0.1, ease: EASE }}>
            <span className="text-xs font-bold tabular-nums text-blue-200/70">{a.t}</span>
            <span className="h-8 w-1 rounded-full" style={{ background: a.c }} />
            <div>
              <p className="text-sm font-bold leading-tight">{a.n}</p>
              <p className="text-[10px] text-blue-200/50">{a.s}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Pantalla CAJA ---------- */
function ScreenCaja({ active }: { active: boolean }) {
  const rows = [
    { m: "Efectivo", v: "150 €", w: 0.36 },
    { m: "Tarjeta", v: "245 €", w: 0.58 },
    { m: "Bizum", v: "25 €", w: 0.06 },
  ];
  return (
    <div className="flex h-full flex-col px-5 pb-6 pt-12 text-white">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-200/50">Caja · hoy</p>
      <p className="mb-1 text-4xl font-extrabold tracking-tighter"><CountUp to={420} run={active} suffix=" €" /></p>
      <p className="mb-6 text-[11px] text-blue-200/50">Total del día</p>
      <div className="space-y-4">
        {rows.map((r, i) => (
          <div key={r.m}>
            <div className="mb-1.5 flex justify-between text-xs"><span className="text-blue-200/60">{r.m}</span><span className="font-bold tabular-nums">{r.v}</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))" }} initial={{ width: 0 }} animate={active ? { width: `${r.w * 100}%` } : {}} transition={{ delay: 0.3 + i * 0.12, duration: 0.9, ease: EASE }} />
            </div>
          </div>
        ))}
      </div>
      <button className="mt-auto w-full rounded-xl py-3 text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}>Cerrar caja</button>
    </div>
  );
}

/* ---------- Pantalla WEB (landing tenant) ---------- */
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

const SCREENS = [
  { id: "inicio", label: "Inicio", render: (a: boolean) => <ScreenInicio active={a} /> },
  { id: "agenda", label: "Agenda", render: (a: boolean) => <ScreenAgenda active={a} /> },
  { id: "caja", label: "Caja", render: (a: boolean) => <ScreenCaja active={a} /> },
  { id: "web", label: "Web", render: () => <ScreenWeb /> },
];

export function GlowappPhoneCarousel() {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const go = (d: number) => { setDir(d); setIdx((i) => (i + d + SCREENS.length) % SCREENS.length); };

  return (
    <div className="relative h-full w-full">
      {/* Pantalla activa */}
      <div className="absolute inset-0 overflow-hidden bg-[#0a0f1e]">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={SCREENS[idx].id}
            custom={dir}
            initial={(d: number) => ({ opacity: 0, x: d * 40 })}
            animate={{ opacity: 1, x: 0 }}
            exit={(d: number) => ({ opacity: 0, x: -d * 40 })}
            transition={{ duration: 0.35, ease: EASE }}
            className="absolute inset-0"
          >
            {SCREENS[idx].render(true)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 gap-1.5">
        {SCREENS.map((s, i) => (
          <button key={s.id} onClick={() => { setDir(i > idx ? 1 : -1); setIdx(i); }} className="h-1.5 rounded-full transition-all duration-300" style={{ width: i === idx ? 16 : 6, background: i === idx ? "hsl(var(--accent))" : "rgba(255,255,255,0.3)" }} aria-label={s.label} />
        ))}
      </div>

      {/* Flechas (overlay en los bordes de la pantalla) */}
      <button onClick={() => go(-1)} className="absolute left-2 top-1/2 z-40 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white backdrop-blur-md transition hover:bg-black/50 active:scale-95" aria-label="Anterior">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button onClick={() => go(1)} className="absolute right-2 top-1/2 z-40 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white backdrop-blur-md transition hover:bg-black/50 active:scale-95" aria-label="Siguiente">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
