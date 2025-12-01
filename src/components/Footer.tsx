import { MapPin, Phone, Mail, Clock, Instagram, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
export const Footer = () => {
  return <footer className="border-t bg-salon-cream relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Contacto */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-foreground">Contacto</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  {import.meta.env.VITE_LOCATION_ADDRESS}<br />
                  {import.meta.env.VITE_LOCATION_POSTAL_CODE} {import.meta.env.VITE_LOCATION_CITY}, {import.meta.env.VITE_LOCATION_PROVINCE}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">{import.meta.env.VITE_CONTACT_PHONE_DISPLAY}</p>
              </div>
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-primary" />
                <a 
                  href={import.meta.env.VITE_CONTACT_WHATSAPP_LINK} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {import.meta.env.VITE_CONTACT_WHATSAPP_DISPLAY}
                </a>
              </div>
            </div>
          </div>

          {/* Horario */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-foreground">Horario</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{import.meta.env.VITE_SCHEDULE_TUESDAY_LABEL}</p>
                  <p>{import.meta.env.VITE_SCHEDULE_TUESDAY_HOURS}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 ml-8">
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{import.meta.env.VITE_SCHEDULE_SATURDAY_LABEL}</p>
                  <p>{import.meta.env.VITE_SCHEDULE_SATURDAY_HOURS}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 ml-8">
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{import.meta.env.VITE_SCHEDULE_CLOSED_LABEL}</p>
                  <p>{import.meta.env.VITE_SCHEDULE_CLOSED_HOURS}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Redes Sociales */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-foreground">Síguenos</h3>
            <div className="flex gap-4">
              <a href={import.meta.env.VITE_SOCIAL_INSTAGRAM_URL} target="_blank" rel="noopener" aria-label="Visita nuestro Instagram" className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:scale-110 hover:shadow-glow-sm">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Mapa */}
        <div className="mt-12">
          <h3 className="mb-4 text-lg font-semibold text-foreground text-center">Encuéntranos</h3>
          <div className="rounded-lg overflow-hidden border shadow-lg">
            <iframe src={import.meta.env.VITE_LOCATION_MAP_EMBED_URL} width="100%" height="400" style={{
            border: 0
          }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title={`Ubicación de ${import.meta.env.VITE_BUSINESS_FULL_NAME}`} />
          </div>
        </div>

        <div className="mt-8 border-t pt-8">
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link 
                to="/politica-privacidad" 
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Política de Privacidad
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link 
                to="/terminos-uso" 
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Términos de Uso
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © {import.meta.env.VITE_LEGAL_COPYRIGHT_YEAR} {import.meta.env.VITE_LEGAL_COMPANY_NAME}. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>;
};