import { motion } from "framer-motion";
import { ReactNode } from "react";
import { ArrowRight, Check, CalendarClock, Wallet, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TenantLandingMockup } from "./mockups/TenantLandingMockup";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ---------- helpers de estilo premium ---------- */

// Tarjeta navy de marca (mismo lenguaje que el hero cinemático)
const cardStyle: React.CSSProperties = {
  background: "linear-gradient(150deg, hsl(223 55% 17%) 0%, hsl(258 45% 8%) 100%)",
  boxShadow: "0 40px 90px -30px rgba(20,22,48,.5), inset 0 1px 2px rgba(255,255,255,.14)",
};

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.16em] text-accent">
      {children}
    </span>
  );
}

/* ---------- Feature spotlights (filas alternas) ---------- */

interface SpotlightProps {
  kicker: string;
  icon: ReactNode;
  title: ReactNode;
  body: string;
  bullets: string[];
  visual: ReactNode;
  reverse?: boolean;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

function Spotlight({ kicker, icon, title, body, bullets, visual, reverse }: SpotlightProps) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      {/* Texto — stagger */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-120px" }}
        className={reverse ? "lg:order-2" : ""}
      >
        <motion.span variants={item} className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
          {icon}
          {kicker}
        </motion.span>
        <motion.h3 variants={item} className="mb-4 text-3xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-4xl">
          {title}
        </motion.h3>
        <motion.p variants={item} className="mb-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
          {body}
        </motion.p>
        <ul className="space-y-3">
          {bullets.map((b) => (
            <motion.li key={b} variants={item} className="flex items-start gap-3">
              <span
                className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full text-white"
                style={{ backgroundImage: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
              >
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              <span className="text-sm text-foreground/80">{b}</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>

      {/* Visual — entrada 3D + flotación idle */}
      <motion.div
        initial={{ opacity: 0, y: 70, rotateX: 18, scale: 0.94 }}
        whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.9, ease: EASE }}
        style={{ perspective: 1200 }}
        className={`flex justify-center ${reverse ? "lg:order-1" : ""}`}
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="relative flex w-full max-w-md items-center justify-center overflow-hidden rounded-[24px] p-5 sm:rounded-[28px] sm:p-8"
          style={cardStyle}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{ background: "radial-gradient(600px circle at 30% 20%, hsl(var(--accent)/0.25), transparent 60%)" }}
          />
          <div className="relative w-full flex justify-center">{visual}</div>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* Visuales compactos por feature */

// Agenda que se llena sola — visual distinto del mockup web (evita redundancia)
const AGENDA_SLOTS = [
  { t: "10:00", n: "María L.", s: "Corte + color", c: "hsl(var(--primary))" },
  { t: "11:30", n: "Ana P.", s: "Peinado", c: "hsl(var(--accent))" },
  { t: "13:00", n: "Carmen R.", s: "Mechas", c: "hsl(199 89% 48%)" },
  { t: "17:30", n: "Sofía D.", s: "Manicura", c: "hsl(142 71% 45%)" },
];
const AgendaFillVisual = () => (
  <div className="relative w-[270px] rounded-2xl bg-white p-5 text-slate-900 shadow-xl">
    <div className="mb-4 flex items-center justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Hoy · agenda</p>
        <p className="text-lg font-extrabold tracking-tight">8 citas</p>
      </div>
      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600">+3 hoy</span>
    </div>
    <div className="space-y-2">
      {AGENDA_SLOTS.map((a, i) => (
        <motion.div
          key={a.t}
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25 + i * 0.13, ease: EASE }}
          className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5"
        >
          <span className="text-[11px] font-bold tabular-nums text-slate-400">{a.t}</span>
          <span className="h-7 w-1 flex-none rounded-full" style={{ background: a.c }} />
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold leading-tight">{a.n}</p>
            <p className="truncate text-[10px] text-slate-400">{a.s}</p>
          </div>
        </motion.div>
      ))}
    </div>
    {/* Toast nueva reserva */}
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 1.05, type: "spring", bounce: 0.4 }}
      className="absolute -bottom-3 -right-3 flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-lg ring-1 ring-black/5"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <span className="text-[11px] font-semibold text-slate-700">Nueva reserva online</span>
    </motion.div>
  </div>
);

const CashVisual = () => (
  <div className="w-[240px] rounded-2xl bg-white p-5 text-slate-900 shadow-xl sm:w-[260px]">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Cierre de caja · hoy</p>
    <p className="mt-1 text-3xl font-extrabold tracking-tight">420,00 €</p>
    <div className="mt-4 space-y-2.5">
      {[
        { m: "Efectivo", v: "150 €", w: "36%" },
        { m: "Tarjeta", v: "245 €", w: "58%" },
        { m: "Bizum", v: "25 €", w: "6%" },
      ].map((r) => (
        <div key={r.m}>
          <div className="mb-1 flex justify-between text-[11px]">
            <span className="text-slate-500">{r.m}</span>
            <span className="font-semibold tabular-nums">{r.v}</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100">
            <div className="h-full rounded-full" style={{ width: r.w, backgroundImage: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))" }} />
          </div>
        </div>
      ))}
    </div>
    <button className="mt-5 w-full rounded-xl py-2.5 text-[13px] font-semibold text-white" style={{ backgroundImage: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}>
      Cerrar caja
    </button>
  </div>
);

const WebVisual = () => (
  <div className="w-full max-w-[340px] overflow-hidden rounded-xl bg-white shadow-xl">
    {/* browser chrome */}
    <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-3 py-2">
      <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
      <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
      <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
      <span className="ml-2 flex-1 truncate rounded-md bg-white px-2 py-1 text-[10px] text-slate-400">glowapp.app/cristina-munoz</span>
    </div>
    <div className="aspect-[16/9] overflow-hidden">
      <TenantLandingMockup variant="desktop" />
    </div>
  </div>
);

export const FeatureSpotlights = () => {
  return (
    <section id="ventajas" className="relative scroll-mt-20 py-24 md:py-32">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mx-auto mb-20 max-w-2xl text-center"
        >
          <Eyebrow>Por qué <span className="font-ashing">Glowapp</span></Eyebrow>
          <h2 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
            El papeleo no paga facturas.{" "}
            <span className="font-serif italic" style={{ background: "linear-gradient(100deg, hsl(var(--primary)), hsl(var(--accent)))", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
              Los clientes sí.
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
            <span className="font-ashing">Glowapp</span> se encarga de lo aburrido para que tú te dediques a lo que se te da bien.
          </p>
        </motion.div>

        <div className="space-y-24 md:space-y-32">
          <Spotlight
            kicker="Reservas 24/7"
            icon={<CalendarClock className="h-3.5 w-3.5" />}
            title={<>Llena tu agenda<br className="hidden sm:block" /> mientras duermes</>}
            body="Tus clientes reservan desde tu web a cualquier hora, sin que cojas el teléfono. Cada hueco libre se vende solo."
            bullets={["Confirmación automática por la app", "Recordatorios que reducen los plantones", "Si cancelan, el hueco se libera solo"]}
            visual={<AgendaFillVisual />}
          />
          <Spotlight
            reverse
            kicker="Caja y cuentas"
            icon={<Wallet className="h-3.5 w-3.5" />}
            title={<>Cierra el día<br className="hidden sm:block" /> en 30 segundos</>}
            body="Cobras en efectivo, tarjeta o Bizum y la caja se cuadra sola. Sabes lo que has hecho hoy sin tocar una calculadora."
            bullets={["Cobro al terminar el servicio", "Cierre de caja automático", "Histórico de cada movimiento"]}
            visual={<CashVisual />}
          />
          <Spotlight
            kicker="Tu web profesional"
            icon={<Globe className="h-3.5 w-3.5" />}
            title={<>En Google, no escondido<br className="hidden sm:block" /> en Instagram</>}
            body="Una web con tu nombre, tus precios y tus trabajos. Optimizada para que cuando busquen «peluquería cerca», aparezcas tú."
            bullets={["Dominio propio glowapp.app/tunombre", "Lista para móvil y posicionada en Google", "Galería de trabajos + reseñas reales"]}
            visual={<WebVisual />}
          />
        </div>
      </div>
    </section>
  );
};

/* ---------- Cómo funciona (3 pasos) ---------- */

const STEPS = [
  { n: "01", t: "Crea tu cuenta", d: "1er mes gratis, sin permanencia. En un minuto tienes acceso a tu panel." },
  { n: "02", t: "Configura tu salón", d: "Servicios, horarios y fotos. Te guiamos paso a paso, sin tecnicismos." },
  { n: "03", t: "Abre reservas", d: "Comparte tu web y empieza a recibir citas hoy mismo." },
];

export const HowItWorks = () => {
  return (
    <section id="como-funciona" className="relative scroll-mt-20 py-24 md:py-32">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <Eyebrow>Empezar es fácil</Eyebrow>
          <h2 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
            Tu salón online{" "}
            <span className="font-serif italic" style={{ background: "linear-gradient(100deg, hsl(var(--primary)), hsl(var(--accent)))", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
              en tres pasos
            </span>
          </h2>
        </motion.div>

        <motion.div
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.22, delayChildren: 0.1 } } }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="relative mx-auto grid max-w-5xl gap-5 md:grid-cols-3"
        >
          {/* Línea conectora (desktop) que se dibuja */}
          <motion.div
            aria-hidden
            variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 1.1, ease: EASE, delay: 0.2 } } }}
            style={{ transformOrigin: "left", backgroundImage: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))" }}
            className="absolute left-[16%] right-[16%] top-12 hidden h-px md:block"
          />
          {STEPS.map((s) => (
            <motion.div
              key={s.n}
              variants={{
                hidden: { opacity: 0, y: 40, scale: 0.96 },
                show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", duration: 0.7, bounce: 0.28 } },
              }}
              className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card/80 p-7 shadow-sm backdrop-blur-sm transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1 hover:shadow-[0_24px_50px_-16px_rgba(20,22,48,0.18)]"
            >
              <span
                className="relative z-10 inline-flex h-12 w-12 items-center justify-center rounded-2xl font-serif text-2xl italic text-white shadow-lg shadow-primary/25"
                style={{ backgroundImage: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
              >
                {s.n}
              </span>
              <h3 className="mb-2 mt-5 text-xl font-bold tracking-tight text-foreground">{s.t}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{s.d}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

/* ---------- CTA de cierre (tarjeta premium navy) ---------- */

export const ClosingCTA = () => {
  const navigate = useNavigate();
  return (
    <section className="relative py-24 md:py-32">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="relative mx-auto max-w-5xl overflow-hidden rounded-[36px] px-6 py-16 text-center md:py-24"
          style={cardStyle}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{ background: "radial-gradient(800px circle at 50% 0%, hsl(var(--accent)/0.3), transparent 60%)" }}
          />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-balance text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl">
              Tu salón merece dejar de funcionar{" "}
              <span className="font-serif italic" style={{ background: "linear-gradient(100deg, #93b4ff, #d9a7ff)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
                con una libreta.
              </span>
            </h2>
            <p className="mx-auto mt-6 max-w-md text-base text-white/65 sm:text-lg">
              Monta <span className="font-ashing">Glowapp</span> en 5 minutos. Gratis el primer mes, sin permanencia.
            </p>
            <div className="mt-10 flex justify-center">
              <button
                onClick={() => navigate("/onboarding")}
                className="group inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-base font-semibold text-white shadow-[0_8px_30px_-6px_hsl(var(--primary)/0.7)] transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:shadow-[0_16px_44px_-6px_hsl(var(--accent)/0.75)] active:scale-[0.98]"
                style={{ backgroundImage: "linear-gradient(100deg, hsl(var(--primary)), hsl(var(--accent)))" }}
              >
                Crea tu salón gratis
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </div>
            <p className="mt-5 text-sm text-white/45">Listo en 5 minutos · Sin tarjeta · Cancela cuando quieras</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
