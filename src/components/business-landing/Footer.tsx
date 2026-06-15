import { Link } from "react-router-dom";
import { Instagram, Mail, Heart } from "lucide-react";
import glowappLogo from "@/assets/glowapp-logo.png";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground/[0.03] border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <img src={glowappLogo} alt="GlowApp" className="h-8 mb-4" />
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
              La plataforma todo-en-uno para profesionales de la belleza. Reservas, agenda, pagos y marketing en un solo lugar.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://instagram.com/glowapp.app"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center hover:border-primary hover:text-primary text-muted-foreground transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="mailto:contacto@glowapp.app"
                className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center hover:border-primary hover:text-primary text-muted-foreground transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/privacidad" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Política de privacidad
                </Link>
              </li>
              <li>
                <Link to="/terminos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Términos de uso
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">Contacto</h4>
            <ul className="space-y-2">
              <li>
                <a href="mailto:contacto@glowapp.app" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  contacto@glowapp.app
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">© {currentYear} <span className="font-ashing">Glowapp</span>. Todos los derechos reservados.</p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Hecho con <Heart className="w-4 h-4 text-red-500 fill-red-500" /> en España
          </p>
        </div>
      </div>

      <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
    </footer>
  );
};
