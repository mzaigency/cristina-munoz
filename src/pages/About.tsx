import { SEO } from "@/components/SEO";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const About = () => {
  const {
    ref: heroRef,
    isVisible: heroVisible
  } = useScrollAnimation(0.1);
  const {
    ref: quoteRef,
    isVisible: quoteVisible
  } = useScrollAnimation(0.1);
  const {
    ref: teamRef,
    isVisible: teamVisible
  } = useScrollAnimation(0.1);
  
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Sobre Nosotras - Cristina Muñoz Peluquería | 15 Años de Experiencia"
        description="Conoce a Cristina Muñoz y su equipo de profesionales de la peluquería en Santpedor. Más de 15 años de experiencia ofreciendo servicios de calidad con pasión y dedicación."
        keywords="sobre cristina muñoz, peluquería profesional Santpedor, equipo peluquería, experiencia peluquería, peluquera Santpedor"
        canonicalUrl="/sobre-nosotras"
      />
      <Header onNavigate={scrollToSection} activeSection="sobre-nosotras" />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section ref={heroRef} className="py-20 px-4 bg-background">
          <div className="container mx-auto max-w-3xl">
            <div className={`text-center mb-12 scroll-reveal ${heroVisible ? 'visible' : ''}`}>
              <h1 className="text-4xl md:text-5xl font-semibold text-foreground mb-4 tracking-tight">
                Soy {import.meta.env.VITE_ABOUT_OWNER_NAME}
              </h1>
              <div className="w-16 h-0.5 bg-primary mx-auto"></div>
            </div>

            {/* Story Section */}
            <div className={`space-y-6 scroll-reveal ${heroVisible ? 'visible' : ''} stagger-1`}>
              <p className="text-lg text-muted-foreground leading-relaxed text-center">
                {import.meta.env.VITE_ABOUT_STORY_INTRO}
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed text-center">
                {import.meta.env.VITE_ABOUT_STORY_SPECIALTY}
              </p>
            </div>

            {/* Quote Section */}
            <div ref={quoteRef} className={`relative py-12 px-6 md:px-12 mt-16 bg-muted/30 rounded-2xl scroll-reveal ${quoteVisible ? 'visible' : ''}`}>
              <blockquote className="text-center">
                <p className="text-xl md:text-2xl font-medium text-foreground italic">
                  "{import.meta.env.VITE_ABOUT_QUOTE}"
                </p>
              </blockquote>
            </div>

            {/* Team Section */}
            <div ref={teamRef} className={`mt-16 text-center scroll-reveal ${teamVisible ? 'visible' : ''}`}>
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-6 tracking-tight">
                Nuestro Equipo
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                {import.meta.env.VITE_ABOUT_STORY_TEAM}
              </p>
              <a 
                href="/#reserva" 
                className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition-opacity"
              >
                Reserva tu Cita
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;