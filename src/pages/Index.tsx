import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import { ServicesSection } from "@/components/ServicesSection";
import { GallerySection } from "@/components/GallerySection";
import { ReviewsSection } from "@/components/ReviewsSection";
import { BookingFlow } from "@/components/booking/BookingFlow";

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
    <div className="min-h-screen bg-background">
      <Header onNavigate={scrollToSection} activeSection={activeSection} />
      
      <main>
        <div id="inicio">
          <HeroSection onBookNow={handleBookNow} onViewServices={handleViewServices} />
        </div>
        
        <div id="servicios">
          <ServicesSection />
        </div>
        
        <div id="reserva">
          <BookingFlow />
        </div>
        
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
    </div>
  );
};

export default Index;
