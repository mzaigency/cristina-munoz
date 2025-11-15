import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SmoothTitle } from "@/components/animations/SmoothTitle";
export const WhatsAppSection = () => {
  return <section className="py-20 bg-gradient-to-br from-background to-salon-pink-light/20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="space-y-3">
            <SmoothTitle>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                ¿Necesitas Ayuda?
              </h2>
            </SmoothTitle>
            <p className="text-lg text-muted-foreground">
              Nuestro agente de IA está disponible 24/7 para resolver tus dudas,
              ayudarte con tu reserva o cualquier consulta sobre nuestros servicios.
            </p>
          </div>
          
          <Button size="lg" className="bg-[#25D366] hover:bg-[#20BA59] text-white gap-2 text-lg px-8 py-6" onClick={() => {
          const whatsappLink = import.meta.env.VITE_CONTACT_WHATSAPP_LINK;
          const defaultMessage = "Hola, me gustaría hablar con el agente de IA de la peluquería.";
          window.open(`${whatsappLink}?text=${encodeURIComponent(defaultMessage)}`, '_blank');
        }}>
            <MessageCircle className="h-6 w-6" />
            Hablar con nuestro agente de IA
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Respuesta instantánea en WhatsApp
          </p>
        </div>
      </div>
    </section>;
};