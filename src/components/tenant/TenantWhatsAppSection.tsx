import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/animations/ScrollReveal";

interface TenantWhatsAppSectionProps {
  tenantName: string;
  whatsappNumber?: string | null;
  phone?: string | null;
  primaryColor?: string;
}

export const TenantWhatsAppSection = ({ 
  tenantName, 
  whatsappNumber, 
  phone, 
  primaryColor = "#8B5CF6" 
}: TenantWhatsAppSectionProps) => {
  // Use whatsapp number or fallback to phone
  const contactNumber = whatsappNumber || phone;
  
  if (!contactNumber) {
    return null;
  }

  // Clean number for WhatsApp link
  const cleanNumber = contactNumber.replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=Hola, me gustaría pedir información sobre ${tenantName}`;

  return (
    <section className="py-16 relative overflow-hidden">
      <div 
        className="absolute inset-0"
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}05 100%)` 
        }}
      />
      <div className="container mx-auto px-4 relative z-10">
        <ScrollReveal>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-2xl bg-card shadow-xl">
            <div className="flex items-center gap-4">
              <div 
                className="p-4 rounded-full"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <MessageCircle className="h-8 w-8" style={{ color: primaryColor }} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  ¿Tienes dudas?
                </h3>
                <p className="text-muted-foreground">
                  Escríbenos por WhatsApp y te responderemos enseguida
                </p>
              </div>
            </div>
            <Button 
              size="lg" 
              className="gap-2 text-white"
              style={{ backgroundColor: "#25D366" }}
              asChild
            >
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-5 w-5" />
                Enviar WhatsApp
              </a>
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default TenantWhatsAppSection;