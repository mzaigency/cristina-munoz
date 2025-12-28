import { MapPin, Phone, Mail, Clock, Instagram, Facebook } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  primary_color: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
}

interface TenantFooterProps {
  tenant: Tenant;
}

export const TenantFooter = ({ tenant }: TenantFooterProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-16 bg-primary/5">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold mb-4 text-primary">
              {tenant.name}
            </h3>
            <p className="text-muted-foreground mb-4">
              Tu peluquería de confianza{tenant.city && ` en ${tenant.city}`}. 
              Profesionales dedicados a realzar tu belleza con los mejores tratamientos y técnicas.
            </p>
            {/* Social Links */}
            {(tenant.instagram_url || tenant.facebook_url) && (
              <div className="flex gap-3 mt-4">
                {tenant.instagram_url && (
                  <a 
                    href={tenant.instagram_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:opacity-80 transition-opacity"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {tenant.facebook_url && (
                  <a 
                    href={tenant.facebook_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-blue-600 text-white hover:opacity-80 transition-opacity"
                    aria-label="Facebook"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold mb-4">Contacto</h4>
            <div className="space-y-3">
              {tenant.address && (
                <div className="flex items-start gap-3 text-muted-foreground">
                  <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0 text-primary" />
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
                  <Phone className="h-5 w-5 flex-shrink-0 text-primary" />
                  <span>{tenant.phone}</span>
                </a>
              )}

              {tenant.email && (
                <a 
                  href={`mailto:${tenant.email}`}
                  className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="h-5 w-5 flex-shrink-0 text-primary" />
                  <span>{tenant.email}</span>
                </a>
              )}
            </div>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-semibold mb-4">Horario</h4>
            <div className="flex items-start gap-3 text-muted-foreground">
              <Clock className="h-5 w-5 mt-0.5 flex-shrink-0 text-primary" />
              <div>
                <p>Consulta disponibilidad</p>
                <p>al reservar tu cita</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-primary/20 pt-8">
          <div className="flex flex-col items-center gap-4 text-sm text-muted-foreground">
            {/* GlowUp Badge - Prominent on mobile */}
            <a 
              href="https://glowup.app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 border border-blue-500/20 transition-all touch-manipulation"
            >
              <img src="/favicon.png" alt="GlowUp" className="h-5 w-5" />
              <span className="text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                Creado con GlowUp
              </span>
            </a>
            
            {/* Links and Copyright */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
              <div className="flex items-center gap-6">
                <a href="/privacidad" className="hover:text-primary transition-colors py-2 touch-manipulation">
                  Privacidad
                </a>
                <a href="/terminos" className="hover:text-primary transition-colors py-2 touch-manipulation">
                  Términos
                </a>
              </div>
            </div>
            
            <p className="text-center text-xs">
              © {currentYear} {tenant.name}. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default TenantFooter;
