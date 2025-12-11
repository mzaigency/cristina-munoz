import { SEO } from "@/components/SEO";
import { useState, lazy, Suspense } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import { InstallPWA } from "@/components/InstallPWA";

// Lazy load below-the-fold components
const ServicesSection = lazy(() => import("@/components/ServicesSection").then(m => ({ default: m.ServicesSection })));
const GallerySection = lazy(() => import("@/components/GallerySection").then(m => ({ default: m.GallerySection })));
const ReviewsSection = lazy(() => import("@/components/ReviewsSection").then(m => ({ default: m.ReviewsSection })));
const BookingFlow = lazy(() => import("@/components/booking/BookingFlow").then(m => ({ default: m.BookingFlow })));
const WhatsAppSection = lazy(() => import("@/components/WhatsAppSection").then(m => ({ default: m.WhatsAppSection })));
const LocationSection = lazy(() => import("@/components/LocationSection").then(m => ({ default: m.LocationSection })));

// Lightweight skeleton for lazy-loaded sections
const SectionSkeleton = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const Index = () => {
  const [activeSection, setActiveSection] = useState("inicio");

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleBookNow = () => {
    scrollToSection("reserva");
  };

  const handleViewServices = () => {
    scrollToSection("servicios");
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO
        title="Cristina Muñoz - Peluquería en Santpedor | Reserva Online"
        description="Peluquería profesional en Santpedor, comarca del Bages (Barcelona). Especialistas en corte, coloración, mechas, balayage, peinados y tratamientos capilares. Más de 15 años de experiencia. Reserva tu cita online."
        keywords="peluquería Santpedor, peluquería Bages, corte de pelo Santpedor, coloración cabello Santpedor, mechas Santpedor, balayage, peluquería Manresa, peluquería comarca Bages, tratamientos capilares, peinados profesionales, reserva online peluquería"
        canonicalUrl="/"
      />
      <Header onNavigate={scrollToSection} activeSection={activeSection} />

      <main>
        <div id="inicio">
          <HeroSection onBookNow={handleBookNow} onViewServices={handleViewServices} />
        </div>

        <Suspense fallback={<SectionSkeleton />}>
          <div id="servicios">
            <ServicesSection />
          </div>

          <div id="reserva">
            <BookingFlow />
          </div>

          <WhatsAppSection />

          <div id="galeria">
            <GallerySection />
          </div>

          <div id="resenas">
            <ReviewsSection />
          </div>

          <LocationSection />
        </Suspense>

        <div id="contacto">
          <Footer />
        </div>
      </main>

      <InstallPWA />
    </div>
  );
};

export default Index;
