import { MapPin, Phone, Mail, Clock } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  primary_color: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
}

interface TenantFooterProps {
  tenant: Tenant;
}

export const TenantFooter = ({ tenant }: TenantFooterProps) => {
  const primaryColor = tenant.primary_color || '#8B5CF6';
  const currentYear = new Date().getFullYear();

  return (
    <footer 
      className="py-16"
      style={{ 
        background: `linear-gradient(135deg, ${primaryColor}10 0%, ${primaryColor}05 100%)` 
      }}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div>
            <h3 
              className="text-2xl font-bold mb-4"
              style={{ color: primaryColor }}
            >
              {tenant.name}
            </h3>
            <p className="text-muted-foreground">
              Tu peluquería de confianza. Profesionales dedicados a realzar tu belleza.
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold mb-4">Contacto</h4>
            <div className="space-y-3">
              {tenant.address && (
                <div className="flex items-start gap-3 text-muted-foreground">
                  <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: primaryColor }} />
                  <span>
                    {tenant.address}
                    {tenant.city && <>, {tenant.city}</>}
                    {tenant.postal_code && <> ({tenant.postal_code})</>}
                  </span>
                </div>
              )}
              
              {tenant.phone && (
                <a 
                  href={`tel:${tenant.phone}`}
                  className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Phone className="h-5 w-5 flex-shrink-0" style={{ color: primaryColor }} />
                  <span>{tenant.phone}</span>
                </a>
              )}

              {tenant.email && (
                <a 
                  href={`mailto:${tenant.email}`}
                  className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="h-5 w-5 flex-shrink-0" style={{ color: primaryColor }} />
                  <span>{tenant.email}</span>
                </a>
              )}
            </div>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-semibold mb-4">Horario</h4>
            <div className="flex items-start gap-3 text-muted-foreground">
              <Clock className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: primaryColor }} />
              <div>
                <p>Consulta disponibilidad</p>
                <p>al reservar tu cita</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© {currentYear} {tenant.name}. Todos los derechos reservados.</p>
            <p>
              Desarrollado con{" "}
              <a 
                href="https://lovable.dev" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
                style={{ color: primaryColor }}
              >
                Lovable
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default TenantFooter;
