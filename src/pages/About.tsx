import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Quote } from "lucide-react";
import cristinaWorking from "@/assets/cristina-working.png";
import cristinaTeam from "@/assets/cristina-team.png";

const About = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onNavigate={scrollToSection} activeSection="sobre-nosotras" />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-secondary/20 to-background">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16 animate-fade-in">
              <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
                Soy Cristina Muñoz
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-salon-primary to-salon-accent mx-auto"></div>
            </div>

            {/* Story Section */}
            <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
              <div className="space-y-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Siempre he tenido un gran espíritu de superación, y desde pequeña me atrajo el mundo de la belleza. Comencé mi carrera a los 15 años, trabajando en diferentes salones, y después de mucho esfuerzo, logré cumplir mi sueño de abrir mi propio salón hace 14 años.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  A lo largo de este tiempo, he explorado diferentes áreas, pero ahora he decidido dedicarme de lleno a lo que realmente me apasiona: el maquillaje y los recogidos. Tras una formación intensa y muchos años de experiencia, finalmente puedo ofrecer todo mi conocimiento y dedicación para hacer que cada novia se sienta única en su día más especial.
                </p>
              </div>
              <div className="relative group animate-fade-in" style={{ animationDelay: "0.4s" }}>
                <div className="absolute -inset-1 bg-gradient-to-r from-salon-primary to-salon-accent rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                <img 
                  src={cristinaWorking} 
                  alt="Cristina Muñoz trabajando en el salón"
                  className="relative rounded-lg shadow-xl w-full h-auto object-cover"
                />
              </div>
            </div>

            {/* Quote Section */}
            <div className="relative py-16 px-8 md:px-16 bg-gradient-to-r from-salon-primary/10 to-salon-accent/10 rounded-2xl animate-fade-in" style={{ animationDelay: "0.6s" }}>
              <Quote className="absolute top-8 left-8 w-12 h-12 text-salon-primary/20" />
              <blockquote className="text-center relative z-10">
                <p className="text-2xl md:text-3xl font-medium text-foreground italic mb-6">
                  "El maquillaje y el peinado perfectos no solo realzan la belleza de una novia, sino que cuentan su historia en el día más importante de su vida."
                </p>
              </blockquote>
              <Quote className="absolute bottom-8 right-8 w-12 h-12 text-salon-accent/20 rotate-180" />
            </div>

            {/* Team Section */}
            <div className="grid md:grid-cols-2 gap-12 items-center mt-20">
              <div className="relative group order-2 md:order-1 animate-fade-in" style={{ animationDelay: "0.8s" }}>
                <div className="absolute -inset-1 bg-gradient-to-r from-salon-accent to-salon-primary rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                <img 
                  src={cristinaTeam} 
                  alt="Equipo Nuviart Beauty Studio"
                  className="relative rounded-lg shadow-xl w-full h-auto object-cover"
                />
              </div>
              <div className="space-y-6 order-1 md:order-2 text-center md:text-left animate-fade-in" style={{ animationDelay: "1s" }}>
                <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                  Nuviart Beauty Studio
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Un espacio donde la pasión por la belleza se encuentra con la profesionalidad. Cada detalle está pensado para que te sientas especial y única.
                </p>
                <div className="pt-4">
                  <a 
                    href="/#reserva" 
                    className="inline-block px-8 py-3 bg-gradient-to-r from-salon-primary to-salon-accent text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                  >
                    Reserva tu Cita
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
