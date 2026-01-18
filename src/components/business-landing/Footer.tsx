import { Link } from "react-router-dom";
import { Instagram, Mail, Heart } from "lucide-react";
import glowappLogo from "@/assets/glowapp-logo.png";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/50 border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <img src={glowappLogo} alt="GlowApp" className="h-8 mb-4" />
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
              La plataforma todo-en-uno para profesionales de la belleza. Reservas, agenda, pagos y marketing en un solo
              lugar.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://instagram.com/glowapp.es"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="mailto:hola@glowapp.es"
                className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Política de privacidad
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Términos de uso
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contacto</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:hola@glowapp.es"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  hola@glowapp.es
                </a>
              </li>
              <li>
                <a
                  href="https://instagram.com/glowapp.es"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  contacto@glowapp.es
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">© {currentYear} GlowApp. Todos los derechos reservados.</p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Hecho con <Heart className="w-4 h-4 text-red-500 fill-red-500" /> en España
          </p>
        </div>
      </div>

      {/* Safe area for mobile */}
      <div className="h-safe-area-bottom bg-muted/50" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
    </footer>
  );
};
