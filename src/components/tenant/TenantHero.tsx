import { Button } from "@/components/ui/button";
import { Calendar, MapPin } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  primary_color: string | null;
  secondary_color: string | null;
  city: string | null;
  address: string | null;
}

interface TenantHeroProps {
  tenant: Tenant;
  onBookNow: () => void;
}

export const TenantHero = ({ tenant, onBookNow }: TenantHeroProps) => {
  const primaryColor = tenant.primary_color || '#8B5CF6';
  const secondaryColor = tenant.secondary_color || '#D946EF';

  return (
    <section 
      className="relative min-h-[80vh] flex items-center justify-center pt-16"
      style={{
        background: `linear-gradient(135deg, ${primaryColor}15 0%, ${secondaryColor}15 100%)`
      }}
    >
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(${primaryColor} 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
            Bienvenido a{" "}
            <span style={{ color: primaryColor }}>
              {tenant.name}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Tu peluquería de confianza. Reserva tu cita online y descubre nuestros servicios profesionales.
          </p>

          {tenant.city && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-8">
              <MapPin className="h-5 w-5" style={{ color: primaryColor }} />
              <span>{tenant.address ? `${tenant.address}, ` : ''}{tenant.city}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={onBookNow}
              className="text-lg px-8 py-6"
              style={{ 
                backgroundColor: primaryColor,
                color: 'white'
              }}
            >
              <Calendar className="mr-2 h-5 w-5" />
              Reservar Cita
            </Button>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-32"
        style={{
          background: `linear-gradient(to top, hsl(var(--background)), transparent)`
        }}
      />
    </section>
  );
};

export default TenantHero;
