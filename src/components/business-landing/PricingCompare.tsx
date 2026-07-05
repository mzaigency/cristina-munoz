import { motion } from "framer-motion";
import { Check, X, ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EASE, SectionHeader, brandCard } from "./_landingShared";

/**
 * Comparativa de precio — datos verificados 2026. Booksy: 34,99 €+IVA/mes,
 * +8 €/mes por profesional extra, Boost opcional 30% primera visita de clientes
 * nuevos del marketplace (NO cobra comisión por reserva normal). Treatwell:
 * cuota anual + comisión solo por clientes nuevos del marketplace. El arma de
 * Glowapp NO es "más barato": es precio plano + web propia + ser dueña del
 * cliente + 0% comisiones de captación. La tarjeta de Glowapp va destacada en
 * navy de marca; las otras dos, en gris apagado.
 */

const GLOW_FEATURES = [
  "Tu web profesional con dominio propio",
  "Reservas 24/7 desde el móvil",
  "Agenda multi-profesional",
  "Caja y cierre diario",
  "Recordatorios automáticos",
  "Soporte en español incluido",
];

const RIVALS = [
  {
    name: "Booksy",
    price: "34,99 €",
    period: "/mes + IVA",
    note: "+8 €/mes por cada profesional extra que gestione su agenda",
    cons: [
      "La cuota crece con cada silla de tu equipo",
      "Con Boost, el 30% de la primera visita de cada cliente nuevo es para ellos",
      "Tu salón vive en su marketplace, no en tu web",
    ],
  },
  {
    name: "Treatwell",
    price: "Cuota anual",
    period: "+ comisión",
    note: "Pagas comisión por cada cliente nuevo que llega desde su marketplace",
    cons: [
      "Pagas por captar: comisión sobre clientes nuevos",
      "El cliente reserva en su plataforma, no en tu web",
    ],
  },
];

export const PricingCompare = () => {
  const navigate = useNavigate();

  return (
    <section id="precio" className="relative scroll-mt-20 py-24 md:py-32">
      <div className="container mx-auto px-4">
        <SectionHeader
          eyebrow="Precio"
          title={
            <>
              Un precio plano que conoces hoy,{" "}
              <span
                className="font-serif italic"
                style={{ background: "linear-gradient(100deg, hsl(var(--primary)), hsl(var(--accent)))", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
              >
                sin sorpresas a fin de mes.
              </span>
            </>
          }
          subtitle="Primer mes gratis para probarlo todo. Después, desde 29 €/mes — sin comisiones por reserva ni por captar clientes."
          className="mb-16"
        />

        <div className="mx-auto grid max-w-5xl items-center gap-6 lg:grid-cols-[1.1fr_1fr]">
          {/* Glowapp — destacado */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: EASE }}
            className="relative overflow-hidden rounded-[32px] p-8 md:p-10"
            style={brandCard}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-60"
              style={{ background: "radial-gradient(600px circle at 30% 0%, hsl(var(--accent)/0.25), transparent 60%)" }}
            />
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Recomendado
              </span>
              <h3 className="mt-5 font-ashing text-4xl text-white">Glowapp</h3>
              <div className="mt-3 flex items-end gap-2">
                <span
                  className="text-4xl sm:text-5xl font-bold tracking-tight"
                  style={{ background: "linear-gradient(180deg, #ffffff 0%, #b9c0d6 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
                >
                  1er mes gratis
                </span>
                <span className="mb-2 text-sm text-blue-100/60">después, desde 29 €/mes</span>
              </div>
              <p className="mt-1 text-sm text-blue-100/55">Sin permanencia · el precio no sube por reserva ni por cliente nuevo · cancela cuando quieras</p>


              <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                {GLOW_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-blue-50/90">
                    <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => navigate("/onboarding")}
                className="group mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-semibold text-white shadow-[0_8px_30px_-6px_hsl(var(--primary)/0.7)] transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:shadow-[0_16px_44px_-6px_hsl(var(--accent)/0.75)] active:scale-[0.98] sm:w-auto"
                style={{ backgroundImage: "linear-gradient(100deg, hsl(var(--primary)), hsl(var(--accent)))" }}
              >
                Crea tu salón gratis
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </div>
          </motion.div>

          {/* Rivales — apagados */}
          <motion.div
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid gap-6"
          >
            {RIVALS.map((r) => (
              <motion.div
                key={r.name}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
                }}
                className="rounded-3xl border border-border bg-muted/30 p-7"
              >
                <h3 className="text-lg font-bold text-foreground">{r.name}</h3>
                <div className="mt-2 flex items-end gap-1.5">
                  <span className="text-3xl font-bold tracking-tight text-muted-foreground">{r.price}</span>
                  <span className="mb-1 text-sm text-muted-foreground/70">{r.period}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground/80">{r.note}</p>
                <ul className="mt-4 space-y-2">
                  {r.cons.map((c) => (
                    <li key={c} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <X className="mt-0.5 h-4 w-4 flex-none text-destructive/60" />
                      {c}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
