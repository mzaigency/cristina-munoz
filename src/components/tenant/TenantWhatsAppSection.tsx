import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/animations/ScrollReveal";

interface TenantWhatsAppSectionProps {
  tenantName: string;
  whatsappNumber?: string | null;
  phone?: string | null;
  primaryColor?: string; // kept for backwards compatibility but not used
}

export const TenantWhatsAppSection = ({ 
  tenantName, 
  whatsappNumber, 
  phone, 
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
    <section className="py-16 relative overflow-hidden bg-primary/5">
      <div className="container mx-auto px-4 relative z-10">
        <ScrollReveal>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-2xl bg-card shadow-xl">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-full bg-primary/20">
                <MessageCircle className="h-8 w-8 text-primary" />
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
              className="gap-2 bg-[#25D366] hover:bg-[#20BD5C] text-white"
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
