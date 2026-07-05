import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp, CalendarCheck, Clock, PiggyBank } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AnimatedNumber, EASE, brandCard, Eyebrow } from "./_landingShared";

/**
 * Calculadora ROI interactiva. La dueña mueve tres sliders (citas/día, precio
 * medio, días abiertos) y ve EN VIVO lo que pasa por su caja, lo que recupera en
 * plantones, las horas que se ahorra y lo que costaría captar clientes nuevos
 * con Boost de Booksy (30% de la primera visita — dato verificado 2026).
 * Traduce el producto a dinero — el lenguaje del salón. Nada de "Glowapp es
 * gratis": el producto cuesta desde 29 €/mes y se dice.
 */

const lightGradient = "linear-gradient(90deg, #93b4ff, #d9a7ff)";
const eur = (v: number) => `${Math.round(v).toLocaleString("es-ES")} €`;

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}
function Slider({ label, value, min, max, step, display, onChange }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-2.5 flex items-baseline justify-between">
        <span className="text-sm font-medium text-blue-100/80">{label}</span>
        <span className="text-base font-bold text-white tabular-nums">{display}</span>
      </div>
      <div className="relative h-2.5">
        <div className="absolute inset-0 rounded-full bg-white/10" />
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${pct}%`, backgroundImage: lightGradient }}
        />
        <div
          className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-white shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
          style={{ left: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 z-10 w-full cursor-pointer opacity-0"
          aria-label={label}
        />
      </div>
    </div>
  );
}

interface ResultProps {
  Icon: typeof TrendingUp;
  value: number;
  format?: (v: number) => string;
  label: string;
  suffix?: string;
}
function Result({ Icon, value, format = eur, label, suffix }: ResultProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-blue-200">
        <Icon className="h-4 w-4" />
      </span>
      <div
        className="mt-3 text-2xl font-bold tracking-tight tabular-nums"
        style={{ background: lightGradient, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
      >
        <AnimatedNumber value={value} format={format} />
        {suffix}
      </div>
      <p className="mt-0.5 text-[11px] leading-snug text-blue-100/55">{label}</p>
    </div>
  );
}

export const RoiCalculator = () => {
  const navigate = useNavigate();
  const [citasDia, setCitasDia] = useState(12);
  const [precio, setPrecio] = useState(35);
  const [dias, setDias] = useState(6);

  // Estimaciones orientativas
  const citasMes = Math.round(citasDia * dias * 4.3);
  const ingresosMes = citasMes * precio;
  const plantonesEur = Math.round(citasMes * 0.18 * 0.3 * precio); // 18% no-show base, recordatorios recuperan ~30%
  const horasMes = Math.round((citasMes * 4) / 60); // ~4 min de gestión ahorrados por cita
  // 10 clientes nuevos/mes captados vía Boost de Booksy = 30% de su primera visita
  const costeBoost10 = Math.round(10 * precio * 0.3);

  return (
    <section id="calculadora" className="relative scroll-mt-20 py-24 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <Eyebrow>Calculadora</Eyebrow>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: EASE }}
            className="text-balance text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl"
          >
            Mira lo que mueve tu salón{" "}
            <span
              className="font-serif italic"
              style={{ background: "linear-gradient(100deg, hsl(var(--primary)), hsl(var(--accent)))", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
            >
              con <span className="font-ashing">Glowapp</span>.
            </span>
          </motion.h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
            Mueve los controles con los datos de tu negocio. Las cifras se actualizan solas.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="relative mx-auto max-w-5xl overflow-hidden rounded-[32px] p-6 md:p-10"
          style={brandCard}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{ background: "radial-gradient(700px circle at 20% 0%, hsl(var(--accent)/0.22), transparent 60%)" }}
          />
          <div className="relative grid gap-10 lg:grid-cols-[0.85fr_1fr] lg:gap-12">
            {/* Controles */}
            <div className="flex flex-col justify-center gap-7">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-200/70">
                Tu salón
              </p>
              <Slider
                label="Citas al día"
                value={citasDia}
                min={4}
                max={30}
                step={1}
                display={String(citasDia)}
                onChange={setCitasDia}
              />
              <Slider
                label="Precio medio por cita"
                value={precio}
                min={15}
                max={120}
                step={5}
                display={`${precio} €`}
                onChange={setPrecio}
              />
              <Slider
                label="Días abiertos por semana"
                value={dias}
                min={4}
                max={7}
                step={1}
                display={String(dias)}
                onChange={setDias}
              />
            </div>

            {/* Resultados */}
            <div className="flex flex-col gap-5">
              {/* Número héroe */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-blue-100/70">Ingresos que pasan por tu caja</p>
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                    <TrendingUp className="h-3 w-3" /> al mes
                  </span>
                </div>
                <div
                  className="mt-1 text-5xl font-bold tracking-tight tabular-nums sm:text-6xl"
                  style={{ background: lightGradient, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
                >
                  <AnimatedNumber value={ingresosMes} format={eur} />
                </div>
                <p className="mt-1 text-xs text-blue-100/50">
                  ≈ {Math.round(citasDia * dias * 4.3)} citas/mes, gestionadas solas
                </p>
              </div>

              {/* Sub-métricas */}
              <div className="grid grid-cols-2 gap-3">
                <Result Icon={CalendarCheck} value={plantonesEur} label="recuperados en plantones cada mes" />
                <Result Icon={Clock} value={horasMes} format={(v) => `${Math.round(v)} h`} label="que dejas de perder en gestión al mes" />
              </div>

              {/* Ahorro vs Booksy */}
              <div className="flex items-center gap-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
                  <PiggyBank className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    <AnimatedNumber value={costeBoost10} format={eur} />/mes por captar 10 clientes con Boost de Booksy
                  </p>
                  <p className="text-[11px] text-emerald-200/70">Captarlos por tu web y tu QR con <span className="font-ashing">Glowapp</span>: 0 € de comisión. Te lo quedas tú.</p>
                </div>
              </div>

              <button
                onClick={() => navigate("/onboarding")}
                className="group inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-base font-semibold text-white shadow-[0_8px_30px_-6px_hsl(var(--primary)/0.7)] transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:shadow-[0_16px_44px_-6px_hsl(var(--accent)/0.75)] active:scale-[0.98]"
                style={{ backgroundImage: "linear-gradient(100deg, hsl(var(--primary)), hsl(var(--accent)))" }}
              >
                Quiero estos números en mi salón
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>

          <p className="relative mt-7 text-center text-[11px] text-blue-100/40">
            Estimación orientativa a partir de tus datos. Plantones evitados según recordatorios automáticos; coste de captación calculado con la tarifa pública de Boost de Booksy (30% de la primera visita de un cliente nuevo del marketplace, servicio opcional).
          </p>
        </motion.div>
      </div>
    </section>
  );
};
