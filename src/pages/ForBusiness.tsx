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
              "GlowApp ofrece tres planes (Starter, Pro y Business) con 30 días de prueba gratis sin tarjeta. Consulta los precios actuales en la sección de planes de esta página.",
          },
          {
            question: "¿Qué incluye la plataforma para negocios?",
            answer:
              "Incluye página web profesional, sistema de reservas 24/7, calendario inteligente, caja registradora, analytics y publicaciones. Las funcionalidades varían según el plan.",
          },
          {
            question: "¿Puedo gestionar varios estilistas?",
            answer:
              "Sí. Starter incluye 1 profesional, Pro hasta 5 y Business profesionales ilimitados.",
          },
          {
            question: "¿Cómo empiezo a usar GlowApp?",
            answer:
              "Regístrate gratis y configura tu negocio en unos minutos. No necesitas conocimientos técnicos y tienes 30 días de prueba sin compromiso ni tarjeta.",
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
