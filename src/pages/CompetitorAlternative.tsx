import { useParams, Link, Navigate } from "react-router-dom";
import { Check, X, Minus, ArrowRight, ShieldCheck } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { COMPETITORS } from "@/content/competitors";
import { StickyHeader, Footer } from "@/components/business-landing";

export default function CompetitorAlternative() {
  const { competitor } = useParams<{ competitor: string }>();
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
      <div className="min-h-screen bg-background text-foreground">
        <StickyHeader />

        <main className="pt-20 pb-24 px-4 sm:px-6 max-w-5xl mx-auto" style={{ paddingTop: "max(5rem, env(safe-area-inset-top))" }}>
          {/* Hero */}
          <header className="text-center pt-6 pb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
              <ShieldCheck className="w-3.5 h-3.5" />
              Alternativa a {data.name}
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4 text-balance">
              {data.tagline}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8">{data.intro}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/onboarding">
                <Button size="lg" className="w-full sm:w-auto">
                  Empezar gratis 1 mes <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link to="/negocios">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Ver todas las funciones
                </Button>
              </Link>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Stripe pide tarjeta solo para verificar · Cancela cuando quieras</p>
          </header>

          {/* Why change */}
          <section className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">¿Por qué cambiar de {data.name} a Glowapp?</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {data.whyChange.map((reason, i) => (
                <li key={i} className="flex gap-3 p-4 rounded-2xl bg-card border border-border">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base">{reason}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Comparison table */}
          <section className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Glowapp vs {data.name}</h2>
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="grid grid-cols-[1.4fr_1fr_1fr] text-xs sm:text-sm font-semibold bg-muted">
                <div className="p-3 sm:p-4">Característica</div>
                <div className="p-3 sm:p-4 text-center text-primary">Glowapp</div>
                <div className="p-3 sm:p-4 text-center">{data.name}</div>
              </div>
              {data.comparison.map((row, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1.4fr_1fr_1fr] text-xs sm:text-sm border-t border-border"
                >
                  <div className="p-3 sm:p-4 font-medium">{row.feature}</div>
                  <div className={`p-3 sm:p-4 text-center ${row.winner === "glow" ? "bg-primary/5" : ""}`}>
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
          </section>

          {/* Migration */}
          <section className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Cómo migrar desde {data.name}</h2>
            <ol className="space-y-3 max-w-2xl mx-auto">
              {data.migration.map((step, i) => (
                <li key={i} className="flex gap-3 p-4 rounded-2xl bg-card border border-border">
                  <span className="flex w-7 h-7 rounded-full bg-primary text-primary-foreground items-center justify-center font-bold text-sm shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm sm:text-base">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* FAQ */}
          <section className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Preguntas frecuentes</h2>
            <div className="space-y-3 max-w-3xl mx-auto">
              {data.faq.map((item, i) => (
                <details key={i} className="group p-4 rounded-2xl bg-card border border-border">
                  <summary className="cursor-pointer font-semibold text-sm sm:text-base list-none flex items-center justify-between gap-2">
                    {item.question}
                    <span className="text-primary group-open:rotate-180 transition-transform">▾</span>
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="text-center bg-primary/5 border border-primary/20 rounded-3xl p-8 sm:p-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">¿Listo para probar Glowapp?</h2>
            <p className="text-muted-foreground mb-6">Primer mes gratis, sin permanencia. Migración guiada incluida.</p>
            <Link to="/onboarding">
              <Button size="lg">
                Crear mi salón ahora <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
