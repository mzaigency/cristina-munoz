import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, User, Clock, CheckCircle } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  primary_color: string | null;
  phone: string | null;
}

interface Stylist {
  id: string;
  name: string;
  slug: string;
  avatar_url: string | null;
  color: string | null;
}

interface TenantBookingProps {
  tenant: Tenant;
  stylists: Stylist[];
}

export const TenantBooking = ({ tenant, stylists }: TenantBookingProps) => {
  const [selectedStylist, setSelectedStylist] = useState<string | null>(null);
  const primaryColor = tenant.primary_color || '#8B5CF6';

  const handleWhatsAppBooking = () => {
    if (tenant.phone) {
      const message = encodeURIComponent(
        `Hola! Me gustaría reservar una cita en ${tenant.name}.`
      );
      window.open(`https://wa.me/${tenant.phone.replace(/\D/g, '')}?text=${message}`, '_blank');
    }
  };

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Reserva tu Cita</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Elige tu estilista y reserva de forma rápida y sencilla
          </p>
        </div>

        {stylists.length > 0 && (
          <div className="max-w-4xl mx-auto mb-12">
            <h3 className="text-xl font-semibold mb-6 text-center">Nuestro Equipo</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {stylists.map((stylist) => (
                <Card 
                  key={stylist.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedStylist === stylist.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedStylist(stylist.id)}
                  style={{
                    borderColor: selectedStylist === stylist.id ? primaryColor : undefined
                  }}
                >
                  <CardContent className="p-4 text-center">
                    <div 
                      className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-xl font-bold"
                      style={{ 
                        backgroundColor: stylist.color || primaryColor 
                      }}
                    >
                      {stylist.avatar_url ? (
                        <img 
                          src={stylist.avatar_url} 
                          alt={stylist.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        stylist.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <p className="font-medium">{stylist.name}</p>
                    {selectedStylist === stylist.id && (
                      <CheckCircle 
                        className="h-5 w-5 mx-auto mt-2" 
                        style={{ color: primaryColor }}
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-lg mx-auto">
          <Card className="border-2" style={{ borderColor: `${primaryColor}30` }}>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Calendar className="h-5 w-5" style={{ color: primaryColor }} />
                Reservar Ahora
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center text-sm text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <User className="h-5 w-5" style={{ color: primaryColor }} />
                  <span>Elige estilista</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Calendar className="h-5 w-5" style={{ color: primaryColor }} />
                  <span>Selecciona fecha</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Clock className="h-5 w-5" style={{ color: primaryColor }} />
                  <span>Confirma hora</span>
                </div>
              </div>

              <Button
                className="w-full text-lg py-6"
                style={{ backgroundColor: primaryColor }}
                onClick={handleWhatsAppBooking}
              >
                Reservar por WhatsApp
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Próximamente: reserva online completa
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default TenantBooking;
