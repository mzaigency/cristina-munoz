import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone, User, LogOut, Shield, Calendar, MessageCircle, Home } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useT } from "@/lib/tenantI18n";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  phone: string | null;
}

interface TenantHeaderProps {
  tenant: Tenant;
  onNavigate: (section: string) => void;
  activeSection: string;
}

const EASE = [0.22, 1, 0.36, 1] as const;

export const TenantHeader = ({ tenant, onNavigate, activeSection }: TenantHeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { unreadCount } = useUnreadMessages();
  const { user } = useAuth();
  const t = useT();

  const brand = tenant.primary_color || "hsl(var(--primary))";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (user) {
      checkAdminRole(user.id);
    } else {
      setIsAdmin(false);
    }
  }, [user?.id]);

  const checkAdminRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "stylist"]);
    setIsAdmin(data && data.length > 0);
  };

  const navItems = [
    { id: "inicio", label: t("nav.home") },
    { id: "servicios", label: t("nav.services") },
    { id: "reserva", label: t("nav.booking") },
    { id: "resenas", label: t("nav.reviews") },
    { id: "contacto", label: t("nav.contact") },
  ];

  const handleNavClick = (sectionId: string) => {
    onNavigate(sectionId);
    setIsMenuOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error during sign out:", error);
    } finally {
      setIsAdmin(false);
    }
  };

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <div
          className={`flex w-full max-w-3xl items-center gap-2 rounded-full border py-2 pl-2 pr-2 transition-[background-color,box-shadow,border-color] duration-300 sm:pl-3 ${
            isScrolled
              ? "border-border bg-background/85 shadow-[0_8px_30px_-12px_rgba(20,22,48,0.25)] backdrop-blur-xl"
              : "border-white/25 bg-background/25 backdrop-blur-md"
          }`}
        >
          {/* Volver a Glowapp */}
          <Link
            to="/"
            aria-label={t("nav.backToGlow")}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${
              isScrolled ? "bg-muted text-foreground hover:bg-muted/70" : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            <Home className="h-4 w-4" />
          </Link>

          {/* Logo / nombre del salón */}
          <button
            onClick={() => handleNavClick("inicio")}
            className="flex min-w-0 items-center"
            aria-label={tenant.name}
          >
            {tenant.logo_url ? (
              <img src={tenant.logo_url} alt={tenant.name} className="h-8 w-auto rounded-lg" />
            ) : (
              <span
                className={`truncate text-base font-semibold transition-colors duration-300 sm:text-lg ${
                  isScrolled ? "" : "text-white drop-shadow-md"
                }`}
                style={{ color: isScrolled ? brand : undefined, fontFamily: "var(--font-heading)" }}
              >
                {tenant.name}
              </span>
            )}
          </button>

          {/* Navegación escritorio */}
          <nav className="mx-auto hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`text-sm font-medium transition-colors duration-300 ${
                  isScrolled
                    ? activeSection === item.id
                      ? ""
                      : "text-muted-foreground hover:text-foreground"
                    : "text-white/90 hover:text-white drop-shadow-md"
                }`}
                style={{ color: isScrolled && activeSection === item.id ? brand : undefined }}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            {/* Teléfono */}
            {tenant.phone && (
              <a
                href={`tel:${tenant.phone}`}
                aria-label="Llamar"
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-300 touch-manipulation lg:w-auto lg:gap-2 lg:px-4 lg:text-sm lg:font-medium ${
                  isScrolled ? "bg-muted hover:bg-muted/70" : "bg-white/20 text-white hover:bg-white/30"
                }`}
                style={{ color: isScrolled ? brand : undefined }}
              >
                <Phone className="h-4 w-4" />
                <span className="hidden lg:inline">{tenant.phone}</span>
              </a>
            )}

            {/* Cuenta */}
            {user ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-300 ${
                      isScrolled ? "text-foreground hover:bg-muted" : "text-white hover:bg-white/25"
                    }`}
                    aria-label={t("nav.myAccount")}
                  >
                    <User className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-[100] border-border bg-background/95 backdrop-blur">
                  <DropdownMenuLabel>{t("nav.myAccount")}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/perfil")}>
                    <User className="mr-2 h-4 w-4" />
                    Mi Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/mis-citas")}>
                    <Calendar className="mr-2 h-4 w-4" />
                    {t("nav.myBookings")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/mensajes")} className="relative">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Mensajes
                    {unreadCount > 0 && (
                      <span className="absolute right-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-bold text-destructive-foreground">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate(`/admin/${tenant.slug}`)}>
                        <Shield className="mr-2 h-4 w-4" />
                        Panel Admin
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("nav.signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                onClick={() => navigate("/auth")}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-300 ${
                  isScrolled ? "text-foreground hover:bg-muted" : "text-white hover:bg-white/25"
                }`}
                aria-label={t("nav.myAccount")}
              >
                <User className="h-5 w-5" />
              </button>
            )}

            {/* CTA reservar (escritorio) */}
            <button
              onClick={() => handleNavClick("reserva")}
              className="hidden items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] md:inline-flex"
              style={{ backgroundColor: brand }}
            >
              {t("nav.booking")}
            </button>

            {/* Menú móvil */}
            <button
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-300 md:hidden ${
                isScrolled ? "text-foreground hover:bg-muted" : "text-white hover:bg-white/25"
              }`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Menú"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="fixed inset-x-3 z-40 rounded-3xl border border-border bg-background/95 p-4 shadow-xl backdrop-blur-xl md:hidden"
            style={{ top: "calc(max(0.75rem, env(safe-area-inset-top)) + 4rem)" }}
          >
            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`block w-full rounded-2xl px-4 py-3 text-left text-base font-medium transition-colors ${
                    activeSection === item.id ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60"
                  }`}
                  style={{ color: activeSection === item.id ? brand : undefined }}
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="mt-3 space-y-2 border-t border-border pt-3">
              <Link
                to="/"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-full border border-border py-3 text-sm font-medium text-foreground"
              >
                <Home className="h-4 w-4" />
                {t("nav.backToGlow")}
              </Link>
              <button
                onClick={() => handleNavClick("reserva")}
                className="w-full rounded-full py-3 text-sm font-semibold text-white"
                style={{ backgroundColor: brand }}
              >
                {t("nav.booking")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TenantHeader;
