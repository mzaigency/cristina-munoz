import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import { ServicesSection } from "@/components/ServicesSection";
import { GallerySection } from "@/components/GallerySection";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { CancelBooking } from "@/components/booking/CancelBooking";

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

  return (
    <div className="min-h-screen bg-background">
      <Header onNavigate={scrollToSection} activeSection={activeSection} />
      
      <main>
        <div id="inicio">
          <HeroSection onBookNow={handleBookNow} />
        </div>
        
        <div id="servicios">
          <ServicesSection />
        </div>
        
        <div id="galeria">
          <GallerySection />
        </div>
        
        <div id="reserva">
          <BookingFlow />
        </div>
        
        <div id="cancelar">
          <CancelBooking />
        </div>
        
        <div id="contacto">
          <Footer />
        </div>
      </main>
    </div>
  );
};

export default Index;
