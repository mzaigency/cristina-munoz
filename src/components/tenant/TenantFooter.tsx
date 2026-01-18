import { MapPin, Phone, Mail, Clock, Instagram, Facebook } from "lucide-react";
import { useTenantBusinessHours } from "@/hooks/useTenantBusinessHours";

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

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
  tiktok_url?: string | null;
  description?: string | null;
  tagline?: string | null;
}

interface TenantFooterProps {
  tenant: Tenant;
}

const DAYS_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const formatMinutesToTime = (minutes: number) => {
  if (!minutes) return "";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export const TenantFooter = ({ tenant }: TenantFooterProps) => {
  const currentYear = new Date().getFullYear();
  const { businessHours, loading: loadingHours } = useTenantBusinessHours(tenant.id);

  // Agrupar días con el mismo horario
  const getGroupedHours = () => {
    if (!businessHours) return [];
    
    const groups: { days: number[]; hours: string }[] = [];
    
    // Ordenar días: 1-5 (Lun-Vie), luego 6 (Sáb), luego 0 (Dom)
    const orderedDays = [1, 2, 3, 4, 5, 6, 0];
    
    orderedDays.forEach(day => {
      const hours = businessHours[day];
      if (!hours) return;
      
      let hoursStr: string;
      if (hours.isClosed) {
        hoursStr = "Cerrado";
      } else {
        const morning = hours.morningStart && hours.morningEnd 
          ? `${formatMinutesToTime(hours.morningStart)}-${formatMinutesToTime(hours.morningEnd)}`
          : null;
        const afternoon = hours.afternoonStart && hours.afternoonEnd
          ? `${formatMinutesToTime(hours.afternoonStart)}-${formatMinutesToTime(hours.afternoonEnd)}`
          : null;
        
        if (morning && afternoon) {
          hoursStr = `${morning}, ${afternoon}`;
        } else if (morning) {
          hoursStr = morning;
        } else if (afternoon) {
          hoursStr = afternoon;
        } else {
          hoursStr = "Cerrado";
        }
      }
      
      // Buscar grupo existente con el mismo horario
      const existingGroup = groups.find(g => g.hours === hoursStr);
      if (existingGroup) {
        existingGroup.days.push(day);
      } else {
        groups.push({ days: [day], hours: hoursStr });
      }
    });
    
    return groups;
  };

  const formatDaysRange = (days: number[]) => {
    if (days.length === 1) {
      return DAYS_SHORT[days[0] === 0 ? 6 : days[0] - 1];
    }
    
    // Verificar si son consecutivos
    const sortedDays = [...days].sort((a, b) => {
      const orderA = a === 0 ? 7 : a;
      const orderB = b === 0 ? 7 : b;
      return orderA - orderB;
    });
    
    const isConsecutive = sortedDays.every((day, i) => {
      if (i === 0) return true;
      const prevOrder = sortedDays[i - 1] === 0 ? 7 : sortedDays[i - 1];
      const currOrder = day === 0 ? 7 : day;
      return currOrder - prevOrder === 1;
    });
    
    if (isConsecutive && days.length > 2) {
      const first = sortedDays[0];
      const last = sortedDays[sortedDays.length - 1];
      return `${DAYS_SHORT[first === 0 ? 6 : first - 1]}-${DAYS_SHORT[last === 0 ? 6 : last - 1]}`;
    }
    
    return days.map(d => DAYS_SHORT[d === 0 ? 6 : d - 1]).join(", ");
  };

  const groupedHours = getGroupedHours();

  return (
    <footer className="py-16 bg-primary/5" style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom))" }}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold mb-4 text-primary">{tenant.name}</h3>
            <p className="text-muted-foreground mb-4">
              {tenant.description || tenant.tagline || (
                <>Tu espacio de confianza{tenant.city && ` en ${tenant.city}`}. Profesionales dedicados a ofrecerte la mejor experiencia.</>
              )}
            </p>
            {/* Social Links */}
            {(tenant.instagram_url || tenant.facebook_url || tenant.tiktok_url) && (
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
                {tenant.tiktok_url && (
                  <a
                    href={tenant.tiktok_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-black text-white hover:opacity-80 transition-opacity"
                    aria-label="TikTok"
                  >
                    <TikTokIcon className="h-5 w-5" />
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
              <div className="space-y-1 text-sm">
                {loadingHours ? (
                  <p>Cargando horarios...</p>
                ) : groupedHours.length > 0 ? (
                  groupedHours.map((group, idx) => (
                    <div key={idx} className="flex justify-between gap-4">
                      <span className="font-medium">{formatDaysRange(group.days)}</span>
                      <span className={group.hours === "Cerrado" ? "text-muted-foreground/60" : ""}>
                        {group.hours}
                      </span>
                    </div>
                  ))
                ) : (
                  <p>Consulta disponibilidad al reservar</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-primary/20 pt-8">
          <div className="flex flex-col items-center gap-4 text-sm text-muted-foreground">
            {/* GlowApp Badge - Prominent on mobile */}
            <a
              href="https://www.glowapp.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 border border-blue-500/20 transition-all touch-manipulation"
            >
              <img src="/favicon.png" alt="GlowApp" className="h-5 w-5 rounded-md" />
              <span className="text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                Creado con GlowApp
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
