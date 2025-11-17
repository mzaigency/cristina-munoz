import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors, Palette, Sparkles, Flower2 } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import cutService from "@/assets/cut-service.jpg";
import coloringService from "@/assets/coloring-service-new.jpg";
import stylingService from "@/assets/styling-treatments.png";
import beautyService from "@/assets/beauty-service.jpg";
import AnimatedList from "@/components/animations/AnimatedList";
import { Parallax3D } from "@/components/animations/Parallax3D";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { SmoothTitle } from "@/components/animations/SmoothTitle";
const serviceCategories = [{
  category: "Corte",
  icon: Scissors,
  image: cutService,
  services: [{
    name: "Corte hombre",
    duration: "15 min"
  }, {
    name: "Corte y peinado",
    duration: "30 min"
  }, {
    name: "Corte Niño",
    duration: "15 min"
  }, {
    name: "Corte Niña",
    duration: "25 min"
  }, {
    name: "Corte Flequillo",
    duration: "30 min"
  }]
}, {
  category: "Coloración",
  icon: Palette,
  image: coloringService,
  services: [{
    name: "Tinte",
    duration: "1h 25min"
  }, {
    name: "Decoloración",
    duration: "2h"
  }, {
    name: "Mechas melena larga",
    duration: "3h"
  }, {
    name: "Mechas cabello corto",
    duration: "1h 30min"
  }, {
    name: "Balayage",
    duration: "3h"
  }]
}, {
  category: "Peinados y Tratamientos",
  icon: Sparkles,
  image: stylingService,
  services: [{
    name: "Recogido",
    duration: "1h"
  }, {
    name: "Peinar",
    duration: "25 min"
  }, {
    name: "Peinar pelo corto",
    duration: "20 min"
  }, {
    name: "Éclat",
    duration: "30 min"
  }, {
    name: "Hidratación intensiva con peinado",
    duration: "1h 5min"
  }, {
    name: "Hidratación mantenimiento con peinado",
    duration: "45 min"
  }, {
    name: "Lavar y matizar",
    duration: "20 min"
  }]
}, {
  category: "Depilación y Maquillaje",
  icon: Flower2,
  image: beautyService,
  services: [{
    name: "Cejas",
    duration: "10 min"
  }, {
    name: "Labio",
    duration: "10 min"
  }, {
    name: "Makeup",
    duration: "1h"
  }]
}];
export const ServicesSection = () => {
  const {
    ref,
    isVisible
  } = useScrollAnimation(0.1);
  return <section ref={ref} className="py-20 bg-salon-cream">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <SmoothTitle>
            <h2 className="mb-4 text-3xl font-bold text-[#3b2b30] md:text-4xl">
              Nuestros Servicios
            </h2>
          </SmoothTitle>
          <p className="text-lg text-muted-foreground">Descubre nuestra amplia gama de servicios profesionales</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {serviceCategories.map((category, idx) => {
          const Icon = category.icon;
          return <ScrollReveal key={idx} delay={idx * 150}>
                  <Card className="overflow-hidden border-none shadow-lg hover-lift group smooth-3d">
                    <div className="relative h-48 overflow-hidden">
                      <img src={category.image} alt={`Servicio de ${category.category.toLowerCase()} en Cristina Muñoz - Peluquería profesional en Santpedor`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                    </div>
                    <CardHeader>
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
                          <Icon className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <CardTitle className="text-2xl">{category.category}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <AnimatedList items={category.services} showGradients={false} enableArrowNavigation={false} displayScrollbar={false} className="space-y-0" renderItem={(service, index, isSelected) => <div className={`flex items-center justify-between rounded-lg bg-salon-pink-light p-3 transition-all duration-300 hover:bg-salon-gold-light hover:translate-x-2 hover:shadow-md ${isSelected ? 'bg-salon-gold-light' : ''}`}>
                            <span className="font-medium text-foreground">{service.name}</span>
                            <span className="text-sm text-muted-foreground">{service.duration}</span>
                          </div>} />
                    </CardContent>
                  </Card>
              </ScrollReveal>;
        })}
        </div>
      </div>
    </section>;
};