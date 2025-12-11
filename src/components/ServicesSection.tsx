import { Scissors, Palette, Sparkles, Flower2 } from "lucide-react";
import cutService from "@/assets/corte.jpg";
import coloringService from "@/assets/coloracion.jpg";
import stylingService from "@/assets/peinados-tratamientos.jpg";
import beautyService from "@/assets/depilacion-maquillaje.jpg";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { SmoothTitle } from "@/components/animations/SmoothTitle";

const serviceCategories = [
  {
    category: "Corte",
    icon: Scissors,
    image: cutService,
    services: [
      { name: "Corte hombre", duration: "15 min" },
      { name: "Corte y peinado", duration: "30 min" },
      { name: "Corte Niño", duration: "15 min" },
      { name: "Corte Niña", duration: "25 min" },
      { name: "Corte Flequillo", duration: "30 min" },
    ],
  },
  {
    category: "Coloración",
    icon: Palette,
    image: coloringService,
    services: [
      { name: "Tinte", duration: "1h 25min" },
      { name: "Decoloración", duration: "2h" },
      { name: "Mechas melena larga", duration: "3h" },
      { name: "Mechas cabello corto", duration: "1h 30min" },
      { name: "Balayage", duration: "3h" },
    ],
  },
  {
    category: "Peinados y Tratamientos",
    icon: Sparkles,
    image: stylingService,
    services: [
      { name: "Recogido", duration: "1h" },
      { name: "Peinar", duration: "25 min" },
      { name: "Peinar pelo corto", duration: "20 min" },
      { name: "Éclat", duration: "30 min" },
      { name: "Hidratación intensiva con peinado", duration: "1h 5min" },
      { name: "Hidratación mantenimiento con peinado", duration: "45 min" },
      { name: "Lavar y matizar", duration: "20 min" },
    ],
  },
  {
    category: "Depilación y Maquillaje",
    icon: Flower2,
    image: beautyService,
    services: [
      { name: "Cejas", duration: "10 min" },
      { name: "Labio", duration: "10 min" },
      { name: "Makeup", duration: "1h" },
    ],
  },
];

export const ServicesSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <SmoothTitle>
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Nuestros Servicios
            </h2>
          </SmoothTitle>
          <div className="line-accent mx-auto mb-4" />
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubre nuestra amplia gama de servicios profesionales de peluquería en el corazón del Bages
          </p>
        </div>

        <div className="flex flex-col gap-8">
          {serviceCategories.map((category, idx) => {
            const Icon = category.icon;
            const isReversed = idx % 2 !== 0;

            return (
              <ScrollReveal key={idx} delay={idx * 100}>
                {/* Card container with unified shadow */}
                <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/15 border border-border/30 bg-card">
                  <div
                    className={`grid grid-cols-1 lg:grid-cols-2 ${
                      isReversed ? "lg:flex-row-reverse" : ""
                    }`}
                  >
                    {/* Image Section */}
                    <div
                      className={`relative h-64 lg:h-auto lg:min-h-[320px] ${
                        isReversed ? "lg:order-2" : "lg:order-1"
                      }`}
                    >
                      <img
                        src={category.image}
                        alt={`Servicio de ${category.category.toLowerCase()} en Cristina Muñoz`}
                        className="w-full h-full object-cover object-center"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
                      
                      {/* Category Title Overlay */}
                      <div className="absolute top-4 left-4 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary shadow-lg shadow-primary/30">
                          <Icon className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <h3 className="text-2xl font-bold text-white uppercase tracking-wide drop-shadow-lg">
                          {category.category}
                        </h3>
                      </div>
                    </div>

                    {/* Services List Section */}
                    <div
                      className={`p-6 lg:p-8 flex flex-col justify-center border-l-0 lg:border-l border-border/30 ${
                        isReversed ? "lg:order-1 lg:border-l-0 lg:border-r" : "lg:order-2"
                      }`}
                    >
                      <div className="space-y-3">
                        {category.services.map((service, serviceIdx) => (
                          <div
                            key={serviceIdx}
                            className="flex items-center justify-between py-3 border-l-4 border-primary pl-4 hover:bg-accent/50 transition-colors rounded-r-md"
                          >
                            <div>
                              <p className="font-semibold text-foreground">
                                {service.name}
                              </p>
                              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                                {service.duration}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};
