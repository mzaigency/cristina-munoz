import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Quote } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import cristinaWorking from "@/assets/cristina-working.png";
import cristinaTeam from "@/assets/cristina-team.png";
import { BUSINESS_INFO } from "@/config/businessInfo";
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
  return <div className="min-h-screen bg-background">
      <Header onNavigate={scrollToSection} activeSection="sobre-nosotras" />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section ref={heroRef} className="py-20 px-4 bg-gradient-to-b from-secondary/20 to-background">
          <div className="container mx-auto max-w-6xl">
            <div className={`text-center mb-16 scroll-reveal ${heroVisible ? 'visible' : ''}`}>
              <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
                Soy {BUSINESS_INFO.about.ownerName}
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-salon-primary to-salon-accent mx-auto"></div>
            </div>

            {/* Story Section */}
            <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
              <div className={`space-y-6 scroll-reveal ${heroVisible ? 'visible' : ''} stagger-1`}>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {BUSINESS_INFO.about.story.intro}
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {BUSINESS_INFO.about.story.specialty}
                </p>
              </div>
              <div className={`relative group scroll-reveal ${heroVisible ? 'visible' : ''} stagger-2`}>
                <div className="absolute -inset-1 bg-gradient-to-r from-salon-primary to-salon-accent rounded-lg blur opacity-25 group-hover:opacity-50 transition-all duration-500"></div>
                <img src={cristinaWorking} alt={`${BUSINESS_INFO.about.ownerName} trabajando en el salón`} className="relative rounded-lg shadow-xl w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
            </div>

            {/* Quote Section */}
            <div ref={quoteRef} className={`relative py-16 px-8 md:px-16 bg-gradient-to-r from-salon-primary/10 to-salon-accent/10 rounded-2xl scroll-reveal ${quoteVisible ? 'visible' : ''} hover:shadow-2xl transition-shadow duration-500`}>
              
              <blockquote className="text-center relative z-10">
                <p className="text-2xl md:text-3xl font-medium text-foreground italic mb-6">
                  "{BUSINESS_INFO.about.quote}"
                </p>
              </blockquote>
              
            </div>

            {/* Team Section */}
            <div ref={teamRef} className="grid md:grid-cols-2 gap-12 items-center mt-20">
              <div className={`relative group order-2 md:order-1 scroll-reveal ${teamVisible ? 'visible' : ''} stagger-1`}>
                <div className="absolute -inset-1 bg-gradient-to-r from-salon-accent to-salon-primary rounded-lg blur opacity-25 group-hover:opacity-50 transition-all duration-500"></div>
                <img src={cristinaTeam} alt="Equipo Nuviart Beauty Studio" className="relative rounded-lg shadow-xl w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className={`space-y-6 order-1 md:order-2 scroll-reveal ${teamVisible ? 'visible' : ''} stagger-2`}>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                  Nuestro Equipo
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {BUSINESS_INFO.about.story.team}
                </p>
                <div className="pt-4">
                  <a href="/#reserva" className="inline-block px-8 py-3 bg-gradient-to-r from-salon-primary to-salon-accent text-white rounded-lg font-semibold hover:scale-105 hover:shadow-lg transition-all duration-300">
                    Reserva tu Cita
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>;
};
export default About;