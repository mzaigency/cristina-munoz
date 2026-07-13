import { Link } from "react-router-dom";
import { Instagram, Mail, Heart } from "lucide-react";
import glowappLogo from "@/assets/glowapp-logo.png";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground/[0.03] border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2">
            <img src={glowappLogo} alt="GlowApp" width={85} height={32} className="h-8 w-auto mb-4" />
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
                href="mailto:gglowapp@gmail.com"
                className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center hover:border-primary hover:text-primary text-muted-foreground transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">Producto</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/negocios" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Para negocios
                </Link>
              </li>
              <li>
                <Link to="/onboarding" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Empezar gratis
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">Comparativas</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/alternativa-a-booksy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Alternativa a Booksy
                </Link>
              </li>
              <li>
                <Link to="/alternativa-a-treatwell" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Alternativa a Treatwell
                </Link>
              </li>
              <li>
                <Link to="/alternativa-a-fresha" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Alternativa a Fresha
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/privacidad" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacidad
                </Link>
              </li>
              <li>
                <Link to="/terminos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Términos
                </Link>
              </li>
              <li>
                <a href="mailto:gglowapp@gmail.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Contacto
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">© {currentYear} Glowapp. Todos los derechos reservados.</p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Hecho con <Heart className="w-4 h-4 text-red-500 fill-red-500" /> en España
          </p>
        </div>
      </div>

      <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
    </footer>
  );
};
