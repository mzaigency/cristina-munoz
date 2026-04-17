import { SEO } from "@/components/SEO";
import {
  StickyHeader,
  HeroSection,
  ForWhoSection,
  PainPointsSection,
  FeaturesShowcase,
  BeforeAfterSection,
  TestimonialsSection,
  PricingSection,
  FAQSection,
  FinalCTASection,
  Footer,
  FloatingMobileCTA,
} from "@/components/business-landing";
import { B2BLeadForm } from "@/components/business-landing/B2BLeadForm";

export default function ForBusiness() {
  return (
    <>
      <SEO
        title="GlowApp para Negocios | Tu salón de belleza digitalizado"
        description="Reservas 24/7, calendario inteligente, caja registradora y analytics. Todo lo que tu salón necesita para crecer. 30 días gratis."
        keywords="software salón belleza, app peluquería, gestión barbería, reservas online spa, agenda profesional belleza"
        canonicalUrl="/negocios"
        breadcrumbs={[
          { name: "Inicio", url: "/" },
          { name: "Negocios", url: "/negocios" },
        ]}
        faq={[
          {
            question: "¿Cuánto cuesta GlowApp para negocios?",
            answer:
              "GlowApp ofrece 3 planes: Starter desde 19€/mes, Pro desde 39€/mes y Business desde 79€/mes. Todos incluyen 30 días de prueba gratis sin tarjeta.",
          },
          {
            question: "¿Qué incluye la plataforma para negocios?",
            answer:
              "Incluye landing page profesional, sistema de reservas 24/7, gestión de calendario, caja registradora, analytics y stories. Las funcionalidades varían según el plan.",
          },
          {
            question: "¿Puedo gestionar varios estilistas?",
            answer:
              "Sí, dependiendo de tu plan: Starter incluye 1 profesional, Pro hasta 5 y Business profesionales ilimitados.",
          },
          {
            question: "¿Cómo empiezo a usar GlowApp?",
            answer:
              "Regístrate gratis y configura tu negocio en 5 minutos. No necesitas conocimientos técnicos y tendrás 30 días de prueba sin compromiso ni tarjeta.",
          },
        ]}
      />

      <div className="min-h-screen bg-background">
        <StickyHeader />
        <HeroSection />
        <ForWhoSection />
        <PainPointsSection />
        <FeaturesShowcase />
        <BeforeAfterSection />
        <TestimonialsSection />
        <PricingSection />
        <B2BLeadForm />
        <FAQSection />
        <FinalCTASection />
        <Footer />
        <FloatingMobileCTA />
      </div>
    </>
  );
}
