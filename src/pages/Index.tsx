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

const Index = () => {
  const [activeSection, setActiveSection] = useState("inicio");

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 64; // Height of fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
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
      <Header onNavigate={scrollToSection} activeSection={activeSection} />
      
      <main>
        <div id="inicio" className="pt-16">
          <HeroSection onBookNow={handleBookNow} onViewServices={handleViewServices} />
        </div>
        
        <div id="servicios" className="scroll-mt-16">
          <ServicesSection />
        </div>
        
        <div id="reserva" className="scroll-mt-16">
          <BookingFlow />
        </div>
        
        <WhatsAppSection />
        
        <div id="galeria" className="scroll-mt-16">
          <GallerySection />
        </div>
        
        <div id="resenas" className="scroll-mt-16">
          <ReviewsSection />
        </div>
        
        <div id="contacto" className="scroll-mt-16">
          <Footer />
        </div>
      </main>

      <InstallPWA />
    </div>
  );
};

export default Index;
