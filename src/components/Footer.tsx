import { MapPin, Phone, Mail, Clock, Instagram, Facebook } from "lucide-react";

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
                  Calle Principal 123<br />
                  28001 Madrid, España
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">+34 912 345 678</p>
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
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Peluquería Cris. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
