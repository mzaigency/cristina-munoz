import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors, Palette, Sparkles, Flower2 } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import cutService from "@/assets/cut-service.jpg";
import coloringService from "@/assets/coloring-service-new.jpg";
import stylingService from "@/assets/styling-treatments.png";
import beautyService from "@/assets/beauty-service.jpg";
const serviceCategories = [
  {
    category: "Corte",
    icon: Scissors,
    image: cutService,
    services: [
      {
        name: "Corte hombre",
        duration: "15 min",
      },
      {
        name: "Corte y peinado",
        duration: "30 min",
      },
      {
        name: "Corte Niño",
        duration: "15 min",
      },
      {
        name: "Corte Niña",
        duration: "25 min",
      },
      {
        name: "Corte Flequillo",
        duration: "30 min",
      },
    ],
  },
  {
    category: "Coloración",
    icon: Palette,
    image: coloringService,
    services: [
      {
        name: "Tinte",
        duration: "1h 25min",
      },
      {
        name: "Decoloración",
        duration: "2h",
      },
      {
        name: "Mechas melena larga",
        duration: "3h",
      },
      {
        name: "Mechas cabello corto",
        duration: "1h 30min",
      },
      {
        name: "Balayage",
        duration: "3h",
      },
    ],
  },
  {
    category: "Peinados y Tratamientos",
    icon: Sparkles,
    image: stylingService,
    services: [
      {
        name: "Recogido",
        duration: "1h",
      },
      {
        name: "Peinar",
        duration: "25 min",
      },
      {
        name: "Peinar pelo corto",
        duration: "20 min",
      },
      {
        name: "Éclat",
        duration: "30 min",
      },
      {
        name: "Hidratación intensiva con peinado",
        duration: "1h 5min",
      },
      {
        name: "Hidratación mantenimiento con peinado",
        duration: "45 min",
      },
      {
        name: "Lavar y matizar",
        duration: "20 min",
      },
    ],
  },
  {
    category: "Depilación y Maquillaje",
    icon: Flower2,
    image: beautyService,
    services: [
      {
        name: "Cejas",
        duration: "10 min",
      },
      {
        name: "Labio",
        duration: "10 min",
      },
      {
        name: "Makeup",
        duration: "1h",
      },
    ],
  },
];
export const ServicesSection = () => {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <section ref={ref} className="py-32 bg-background">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className={`mb-20 text-center space-y-4 scroll-reveal ${isVisible ? "visible" : ""}`}>
          <h2 className="text-4xl font-bold text-foreground md:text-5xl">Servicios</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experiencias personalizadas diseñadas para realzar tu belleza natural
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
          {serviceCategories.map((category, idx) => {
            const Icon = category.icon;
            return (
              <Card
                key={idx}
                className={`overflow-hidden border border-border/50 shadow-sm hover:shadow-xl transition-all duration-500 scroll-reveal ${isVisible ? "visible" : ""}`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div
                  style={{ backgroundImage: `url(${category.image})` }}
                  className="h-56 bg-cover bg-center relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-6 left-6 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-3xl text-white drop-shadow-lg">{category.category}</CardTitle>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    {category.services.map((service, serviceIdx) => (
                      <div
                        key={serviceIdx}
                        className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-muted/50 transition-colors duration-200 group"
                      >
                        <span className="font-medium text-foreground group-hover:text-primary transition-colors">{service.name}</span>
                        <span className="text-sm text-muted-foreground font-mono">{service.duration}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
