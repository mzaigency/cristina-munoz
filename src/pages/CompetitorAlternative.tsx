import { useLocation, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, X, Minus, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { SEO } from "@/components/SEO";
import { COMPETITORS } from "@/content/competitors";
import { StickyHeader, Footer } from "@/components/business-landing";
import { EASE, Eyebrow, gradientText, gradientBg, brandCard } from "@/components/business-landing/_landingShared";

export default function CompetitorAlternative() {
  const { pathname } = useLocation();
  const competitor = pathname.replace("/alternativa-a-", "").replace(/\/$/, "");
  const data = competitor ? COMPETITORS[competitor] : null;

  if (!data) return <Navigate to="/negocios" replace />;

  const canonical = `/alternativa-a-${data.slug}`;
  const title = `Alternativa a ${data.name} en España | Glowapp`;
  const description = `${data.tagline}. Sin comisión por reserva, primer mes gratis y soporte en español. Compara Glowapp con ${data.name}.`;

  return (
    <>
      <SEO
        title={title}
        description={description}
        keywords={`alternativa a ${data.name}, ${data.name} vs Glowapp, software salón sin comisiones, mejor alternativa ${data.name} España`}
        canonicalUrl={canonical}
        breadcrumbs={[
          { name: "Inicio", url: "/" },
          { name: "Negocios", url: "/negocios" },
          { name: `Alternativa a ${data.name}`, url: canonical },
        ]}
        faq={data.faq}
      />
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
        <StickyHeader />

        {/* HERO */}
        <header
          className="relative liquid-bg pt-32 pb-20 sm:pt-40 sm:pb-28 px-4 sm:px-6 overflow-hidden"
          style={{ paddingTop: "max(8rem, calc(env(safe-area-inset-top) + 6rem))" }}
        >
          <div className="absolute inset-0 -z-10 opacity-40 bg-[radial-gradient(circle_at_top,hsl(var(--accent)/0.18),transparent_55%)]" />
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full liquid-glass-pill text-xs font-semibold uppercase tracking-[0.16em] text-accent mb-6"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Alternativa a {data.name}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.05 }}
              className="text-balance text-4xl sm:text-6xl font-bold leading-[1.05] tracking-tight"
            >
              Lo que pagas en {data.name},{" "}
              <span className="font-serif italic" style={gradientText}>aquí es tuyo.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
              className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground"
            >
              {data.intro}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.25 }}
              className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center"
            >
              <Link
                to="/onboarding"
                className="group inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-accent/40 active:scale-[0.97]"
                style={{ backgroundImage: gradientBg }}
              >
                Empezar gratis 1 mes
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/negocios"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-full px-6 py-3 text-sm font-semibold liquid-glass-pill text-foreground"
              >
                Ver todas las funciones
              </Link>
            </motion.div>
            <p className="mt-4 text-xs text-muted-foreground">Stripe pide tarjeta solo para verificar · Cancela cuando quieras</p>
          </div>
        </header>

        <main className="px-4 sm:px-6 max-w-5xl mx-auto pb-24">
          {/* Why change */}
          <motion.section
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: EASE }}
            className="py-16 sm:py-24"
          >
            <div className="text-center mb-10">
              <Eyebrow>¿Por qué cambiar?</Eyebrow>
              <h2 className="text-balance text-3xl sm:text-5xl font-bold leading-[1.05] tracking-tight">
                5 razones para dejar <span className="font-serif italic" style={gradientText}>{data.name}</span>
              </h2>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {data.whyChange.map((reason, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.45, ease: EASE, delay: i * 0.05 }}
                  className="flex gap-3 p-5 rounded-2xl liquid-glass-card"
                >
                  <span className="flex w-8 h-8 shrink-0 rounded-full items-center justify-center" style={{ backgroundImage: gradientBg }}>
                    <Check className="w-4 h-4 text-white" />
                  </span>
                  <span className="text-sm sm:text-base pt-1">{reason}</span>
                </motion.li>
              ))}
            </ul>
          </motion.section>

          {/* Comparison brand card */}
          <motion.section
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: EASE }}
            className="pb-16 sm:pb-24"
          >
            <div className="text-center mb-10">
              <Eyebrow>Cara a cara</Eyebrow>
              <h2 className="text-balance text-3xl sm:text-5xl font-bold leading-[1.05] tracking-tight">
                <span className="font-ashing">Glowapp</span> vs {data.name}
              </h2>
            </div>

            <div className="rounded-3xl p-1 sm:p-2" style={brandCard}>
              <div className="rounded-[1.3rem] bg-background/95 overflow-hidden">
                <div className="grid grid-cols-[1.3fr_1fr_1fr] text-[11px] sm:text-sm font-semibold uppercase tracking-wider">
                  <div className="p-3 sm:p-5 text-muted-foreground">Característica</div>
                  <div className="p-3 sm:p-5 text-center text-white" style={{ backgroundImage: gradientBg }}>
                    <span className="font-ashing normal-case tracking-normal text-base sm:text-lg">Glowapp</span>
                  </div>
                  <div className="p-3 sm:p-5 text-center text-muted-foreground">{data.name}</div>
                </div>
                {data.comparison.map((row, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[1.3fr_1fr_1fr] text-xs sm:text-sm border-t border-border/60"
                  >
                    <div className="p-3 sm:p-4 font-medium">{row.feature}</div>
                    <div className={`p-3 sm:p-4 text-center ${row.winner === "glow" ? "bg-primary/[0.06]" : ""}`}>
                      <div className="flex items-start gap-1.5 justify-center">
                        {row.winner === "glow" ? (
                          <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        ) : row.winner === "tie" ? (
                          <Minus className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        )}
                        <span>{row.glow}</span>
                      </div>
                    </div>
                    <div className="p-3 sm:p-4 text-center text-muted-foreground">
                      <div className="flex items-start gap-1.5 justify-center">
                        {row.winner === "other" ? (
                          <Check className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
                        ) : row.winner === "tie" ? (
                          <Minus className="w-4 h-4 shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-4 h-4 shrink-0 mt-0.5" />
                        )}
                        <span>{row.other}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Migration */}
          <motion.section
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: EASE }}
            className="pb-16 sm:pb-24"
          >
            <div className="text-center mb-10">
              <Eyebrow>Migración</Eyebrow>
              <h2 className="text-balance text-3xl sm:text-5xl font-bold leading-[1.05] tracking-tight">
                Cómo cambiarte <span className="font-serif italic" style={gradientText}>en 24 horas</span>
              </h2>
            </div>
            <ol className="space-y-3 max-w-2xl mx-auto">
              {data.migration.map((step, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.45, ease: EASE, delay: i * 0.08 }}
                  className="flex gap-4 p-5 rounded-2xl liquid-glass-card"
                >
                  <span
                    className="flex w-9 h-9 rounded-full text-white items-center justify-center font-bold text-sm shrink-0"
                    style={{ backgroundImage: gradientBg }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-sm sm:text-base pt-1">{step}</span>
                </motion.li>
              ))}
            </ol>
          </motion.section>

          {/* FAQ */}
          <motion.section
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: EASE }}
            className="pb-16 sm:pb-24"
          >
            <div className="text-center mb-10">
              <Eyebrow>FAQ</Eyebrow>
              <h2 className="text-balance text-3xl sm:text-5xl font-bold leading-[1.05] tracking-tight">
                Preguntas <span className="font-serif italic" style={gradientText}>frecuentes</span>
              </h2>
            </div>
            <div className="space-y-3 max-w-3xl mx-auto">
              {data.faq.map((item, i) => (
                <details key={i} className="group p-5 rounded-2xl liquid-glass-card">
                  <summary className="cursor-pointer font-semibold text-sm sm:text-base list-none flex items-center justify-between gap-2">
                    {item.question}
                    <span className="text-accent group-open:rotate-180 transition-transform">▾</span>
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
                </details>
              ))}
            </div>
          </motion.section>

          {/* CTA brand card */}
          <motion.section
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: EASE }}
            className="text-center rounded-3xl p-10 sm:p-16 text-white relative overflow-hidden"
            style={brandCard}
          >
            <Sparkles className="absolute top-6 right-6 w-6 h-6 text-accent opacity-60" />
            <h2 className="text-3xl sm:text-5xl font-bold leading-[1.05] tracking-tight mb-4">
              Tu salón merece más que <span className="font-serif italic" style={gradientText}>{data.name}</span>
            </h2>
            <p className="text-white/70 mb-8 max-w-xl mx-auto">Primer mes gratis, sin permanencia. Migración guiada incluida.</p>
            <Link
              to="/onboarding"
              className="group inline-flex items-center justify-center gap-1.5 rounded-full px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-accent/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.97]"
              style={{ backgroundImage: gradientBg }}
            >
              Crear mi salón ahora
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.section>
        </main>
        <Footer />
      </div>
    </>
  );
}
