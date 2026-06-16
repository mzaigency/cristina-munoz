import { SEO } from "@/components/SEO";
import {
  StickyHeader,
  CinematicHero,
  MobileHeroStory,
  SocialProofStrip,
  PanelShowcase,
  SalonTestimonials,
  HowItWorks,
  PricingCompare,
  FAQSection,
  ClosingCTA,
  Footer,
} from "@/components/business-landing";
import { Preloader } from "@/components/ui/preloader";
import { LandingBackground } from "@/components/ui/landing-background";
import glowappLogo from "@/assets/glowapp-logo.png";

export default function ForBusiness() {
  return (
    <>
      <SEO
        title="Glowapp para Negocios | Tu salón de belleza digitalizado, gratis"
        description="Reservas 24/7, agenda, caja y tu propia web profesional. Todo lo que tu salón necesita en una sola app. Empieza gratis, sin permanencia."
        keywords="software salón belleza, app peluquería, gestión barbería, reservas online spa, agenda profesional belleza, alternativa Booksy gratis"
        canonicalUrl="/negocios"
        breadcrumbs={[
          { name: "Inicio", url: "/" },
          { name: "Negocios", url: "/negocios" },
        ]}
        faq={[
          {
            question: "¿Cuánto cuesta empezar con Glowapp?",
            answer:
              "Empezar es gratis el primer mes. Creas tu salón, montas tu web y abres reservas sin pagar nada para arrancar.",
          },
          {
            question: "¿Qué incluye la plataforma para negocios?",
            answer:
              "Incluye página web profesional, sistema de reservas 24/7, agenda inteligente multi-profesional, caja registradora, fichas de clientes y analytics.",
          },
          {
            question: "¿Puedo gestionar varios profesionales?",
            answer:
              "Sí. Puedes añadir varios profesionales, cada uno con su propio horario y calendario. Los clientes eligen con quién reservar.",
          },
          {
            question: "¿Necesito conocimientos técnicos?",
            answer:
              "No. Glowapp se usa desde el móvil sin saber de tecnología y la configuración básica tarda unos 5 minutos guiados paso a paso.",
          },
        ]}
      />

      <div className="relative min-h-screen">
        <LandingBackground />
        <Preloader logoUrl={glowappLogo} logoVariant="bare" />
        <StickyHeader />
        <CinematicHero />
        <MobileHeroStory />
        <SocialProofStrip />
        <PanelShowcase />
        <SalonTestimonials />
        <HowItWorks />
        <PricingCompare />
        <FAQSection />
        <ClosingCTA />
        <Footer />
      </div>
    </>
  );
}
