import { MapPin, Clock, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { SmoothTitle } from "@/components/animations/SmoothTitle";
export const LocationSection = () => {
  return <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center max-w-3xl mx-auto">
          <SmoothTitle>
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Peluquería en Santpedor
            </h2>
          </SmoothTitle>
          <p className="text-lg text-muted-foreground">
            Ubicados en el centro de Santpedor, en la comarca del Bages (Barcelona), 
            ofrecemos servicios de peluquería profesional con más de 15 años de experiencia. 
            Un salón moderno y acogedor donde cuidamos cada detalle para que disfrutes de una experiencia única.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          <ScrollReveal delay={0}>
            <Card className="text-center h-full">
              <CardContent className="pt-4 pb-4">
                <div className="flex justify-center mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <h3 className="font-semibold mb-1.5 text-sm text-foreground">Ubicación Céntrica</h3>
                <p className="text-xs text-muted-foreground">
                  En pleno centro de Santpedor, fácil acceso y aparcamiento cercano
                </p>
              </CardContent>
            </Card>
          </ScrollReveal>

          <ScrollReveal delay={150}>
            <Card className="text-center h-full">
              <CardContent className="pt-4 pb-4">
                <div className="flex justify-center mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <h3 className="font-semibold mb-1.5 text-sm text-foreground">Horario</h3>
                <p className="text-xs text-muted-foreground">
                  De Martes a Viernes de 9:00 a 12:30 y de 15:00 a 19:00, los Sábados de 8:00 a 13:00. Lunes y Domingos cerrado.
                </p>
              </CardContent>
            </Card>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <Card className="text-center h-full">
              <CardContent className="pt-4 pb-4">
                <div className="flex justify-center mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <h3 className="font-semibold mb-1.5 text-sm text-foreground">Reserva tu Cita</h3>
                <p className="text-xs text-muted-foreground">
                  Llámanos o reserva online. Atención personalizada y profesional
                </p>
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm max-w-2xl mx-auto text-gray-600">
            Llevamos años sirviendo a clientes de Santpedor, Manresa, Navarcles, Sallent, Callús y toda la comarca del Bages. Tu peluquería de referencia en la zona con servicios de corte, coloración, mechas, balayage, peinados y tratamientos capilares.
          </p>
        </div>
      </div>
    </section>;
};