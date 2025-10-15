import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors, Palette, Sparkles, Flower2 } from "lucide-react";
import cutService from "@/assets/cut-service.jpg";
import coloringService from "@/assets/coloring-service.jpg";
import stylingService from "@/assets/styling-service.jpg";
const serviceCategories = [{
  category: "Corte",
  icon: Scissors,
  image: cutService,
  services: [{
    name: "Corte chico",
    duration: "15 min"
  }]
}, {
  category: "Coloración",
  icon: Palette,
  image: coloringService,
  services: [{
    name: "Tinte",
    duration: "1h 25min"
  }, {
    name: "Mechas largas",
    duration: "3h"
  }, {
    name: "Mechas cortas",
    duration: "1h 30min"
  }, {
    name: "Éclat",
    duration: "30 min"
  }]
}, {
  category: "Peinados y Tratamientos",
  icon: Sparkles,
  image: stylingService,
  services: [{
    name: "Recogido",
    duration: "60 min"
  }, {
    name: "Peinar con bucles",
    duration: "25 min"
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
  category: "Depilación Facial",
  icon: Flower2,
  image: stylingService,
  services: [{
    name: "Cejas",
    duration: "10 min"
  }, {
    name: "Bigote",
    duration: "10 min"
  }, {
    name: "Labio",
    duration: "10 min"
  }]
}];
export const ServicesSection = () => {
  return <section className="py-20 bg-salon-cream">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Nuestros Servicios
          </h2>
          <p className="text-lg text-muted-foreground">
            Descubre nuestra amplia gama de servicios profesionales
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {serviceCategories.map((category, idx) => {
          const Icon = category.icon;
          return <Card key={idx} className="overflow-hidden border-none shadow-lg">
                <div style={{
              backgroundImage: `url(${category.image})`
            }} className="h-48 bg-cover bg-center mx-0" />
                <CardHeader>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                      <Icon className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-2xl">{category.category}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.services.map((service, serviceIdx) => <div key={serviceIdx} className="flex items-center justify-between rounded-lg bg-salon-pink-light p-3">
                        <span className="font-medium text-foreground">{service.name}</span>
                        <span className="text-sm text-muted-foreground">{service.duration}</span>
                      </div>)}
                  </div>
                </CardContent>
              </Card>;
        })}
        </div>
      </div>
    </section>;
};