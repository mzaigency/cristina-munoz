import { SEO } from "@/components/SEO";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import { ServicesSection } from "@/components/ServicesSection";
import { GallerySection } from "@/components/GallerySection";
import { ReviewsSection } from "@/components/ReviewsSection";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { WhatsAppSection } from "@/components/WhatsAppSection";
import { InstallPWA } from "@/components/InstallPWA";
import { LoadingScreen } from "@/components/LoadingScreen";

const Index = () => {
  const [activeSection, setActiveSection] = useState("inicio");
  const [isLoading, setIsLoading] = useState(true);

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
    <>
      {isLoading && <LoadingScreen onLoadingComplete={() => setIsLoading(false)} />}
      
      <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO 
        title="Cristina Muñoz - Peluquería en Santpedor | Reserva tu Cita Online"
        description="Reserva tu cita online en Cristina Muñoz, peluquería profesional en Santpedor. Especialistas en corte, coloración, mechas, balayage, peinados y tratamientos capilares. Más de 15 años de experiencia."
        keywords="peluquería Santpedor, peluquería cerca de mí, corte de pelo Santpedor, coloración cabello Santpedor, mechas Santpedor, balayage, tratamientos capilares, peinados profesionales, reserva online peluquería, peluquería Bages"
        canonicalUrl="/"
      />
      <Header onNavigate={scrollToSection} activeSection={activeSection} />
      
      <main>
        <div id="inicio">
          <HeroSection onBookNow={handleBookNow} onViewServices={handleViewServices} isLoadingComplete={!isLoading} />
        </div>
        
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
        
        <div id="contacto">
          <Footer />
        </div>
      </main>

      <InstallPWA />
      </div>
    </>
  );
};

export default Index;
