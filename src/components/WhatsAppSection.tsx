import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const WhatsAppSection = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#25D366]/10 via-background to-[#25D366]/5 border border-[#25D366]/20 p-12">
            <div className="relative z-10 text-center space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#25D366]/10 mb-4">
                <MessageCircle className="h-8 w-8 text-[#25D366]" />
              </div>
              
              <div className="space-y-3">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  Asistencia Inmediata
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Nuestro agente inteligente está disponible 24/7 para resolver tus consultas
                  sobre servicios, reservas y disponibilidad.
                </p>
              </div>
              
              <Button
                size="lg"
                className="bg-[#25D366] hover:bg-[#20BA59] text-white gap-2 text-base px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                onClick={() => {
                  const message = encodeURIComponent("Hola, me gustaría hablar con el agente de IA de la peluquería.");
                  window.open(`https://wa.me/34674034526?text=${message}`, '_blank');
                }}
              >
                <MessageCircle className="h-5 w-5" />
                Iniciar conversación
              </Button>
              
              <p className="text-sm text-muted-foreground">
                Respuesta instantánea por WhatsApp
              </p>
            </div>
            
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#25D366]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#25D366]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          </div>
        </div>
      </div>
    </section>
  );
};
