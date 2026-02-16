import { Link } from "react-router-dom";
import { Instagram, Mail, Heart } from "lucide-react";
import glowappLogo from "@/assets/glowapp-logo.png";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[hsl(230,20%,4%)] border-t border-white/10">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <img src={glowappLogo} alt="GlowApp" className="h-8 mb-4" />
            <p className="text-sm text-white/50 max-w-sm mb-4">
              La plataforma todo-en-uno para profesionales de la belleza. Reservas, agenda, pagos y marketing en un solo
              lugar.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://instagram.com/glowapp.app"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:border-primary hover:text-primary text-white/60 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="mailto:contacto@glowapp.app"
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:border-primary hover:text-primary text-white/60 transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/privacidad" className="text-sm text-white/50 hover:text-white transition-colors">
                  Política de privacidad
                </Link>
              </li>
              <li>
                <Link to="/terminos" className="text-sm text-white/50 hover:text-white transition-colors">
                  Términos de uso
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Contacto</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:contacto@glowapp.app"
                  className="text-sm text-white/50 hover:text-white transition-colors"
                >
                  contacto@glowapp.app
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/40">© {currentYear} GlowApp. Todos los derechos reservados.</p>
          <p className="text-sm text-white/40 flex items-center gap-1">
            Hecho con <Heart className="w-4 h-4 text-red-500 fill-red-500" /> en España
          </p>
        </div>
      </div>

      {/* Safe area for mobile */}
      <div className="bg-[hsl(230,20%,4%)]" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
    </footer>
  );
};
