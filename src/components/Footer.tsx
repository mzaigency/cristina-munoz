import { MapPin, Phone, Mail, Clock, Instagram } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t bg-salon-cream">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Contacto */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-foreground">Contacto</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Carrer Pompeu Fabra, 20, Bajos<br />
                  08251 Santpedor, Barcelona
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">+34 938 321 054</p>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">info@peluqueriacris.es</p>
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
                  <p className="font-medium text-foreground">Mar - Vie</p>
                  <p>9:00 - 12:30 / 15:00 - 19:00</p>
                </div>
              </div>
              <div className="flex items-start gap-3 ml-8">
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Sábado</p>
                  <p>8:00 - 13:00</p>
                </div>
              </div>
              <div className="flex items-start gap-3 ml-8">
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Lun y Dom</p>
                  <p>Cerrado</p>
                </div>
              </div>
            </div>
          </div>

          {/* Redes Sociales */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-foreground">Síguenos</h3>
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/cristinamunoz_hairstylist/"
                target="_blank"
                rel="noopener"
                aria-label="Visita nuestro Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Mapa */}
        <div className="mt-12">
          <h3 className="mb-4 text-lg font-semibold text-foreground text-center">Encuéntranos</h3>
          <div className="rounded-lg overflow-hidden border shadow-lg">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2990.2!2d1.8234!3d41.8045!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12a4f8f8f8f8f8f8%3A0x0!2sCarrer%20Pompeu%20Fabra%2C%2020%2C%2008251%20Santpedor%2C%20Barcelona!5e0!3m2!1ses!2ses!4v1234567890"
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Ubicación de Cristina Muñoz Peluquería"
            />
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Cristina Muñoz. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
