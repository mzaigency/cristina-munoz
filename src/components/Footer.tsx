import { MapPin, Phone, Mail, Clock, Instagram, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { BUSINESS_INFO } from "@/config/businessInfo";
export const Footer = () => {
  return <footer className="border-t bg-salon-cream">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Contacto */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-foreground">Contacto</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  {BUSINESS_INFO.location.address}<br />
                  {BUSINESS_INFO.location.postalCode} {BUSINESS_INFO.location.city}, {BUSINESS_INFO.location.province}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">{BUSINESS_INFO.contact.phoneDisplay}</p>
              </div>
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-primary" />
                <a 
                  href={BUSINESS_INFO.contact.whatsappLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {BUSINESS_INFO.contact.whatsappDisplay}
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
                  <p className="font-medium text-foreground">{BUSINESS_INFO.schedule.tuesday.label}</p>
                  <p>{BUSINESS_INFO.schedule.tuesday.hours}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 ml-8">
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{BUSINESS_INFO.schedule.saturday.label}</p>
                  <p>{BUSINESS_INFO.schedule.saturday.hours}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 ml-8">
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{BUSINESS_INFO.schedule.closed.label}</p>
                  <p>{BUSINESS_INFO.schedule.closed.hours}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Redes Sociales */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-foreground">Síguenos</h3>
            <div className="flex gap-4">
              <a href={BUSINESS_INFO.social.instagram.url} target="_blank" rel="noopener" aria-label="Visita nuestro Instagram" className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Mapa */}
        <div className="mt-12">
          <h3 className="mb-4 text-lg font-semibold text-foreground text-center">Encuéntranos</h3>
          <div className="rounded-lg overflow-hidden border shadow-lg">
            <iframe src={BUSINESS_INFO.location.mapEmbedUrl} width="100%" height="400" style={{
            border: 0
          }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title={`Ubicación de ${BUSINESS_INFO.fullName}`} />
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
              © {BUSINESS_INFO.legal.copyrightYear} {BUSINESS_INFO.legal.companyName}. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>;
};