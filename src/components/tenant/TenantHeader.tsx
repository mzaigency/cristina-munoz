import { useState, useEffect } from "react";
import { Menu, X, Phone, User, LogOut, Shield, Calendar, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
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

export const TenantHeader = ({ tenant, onNavigate, activeSection }: TenantHeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { unreadCount } = useUnreadMessages();
  const { user } = useAuth();
  const t = useT();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

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

  const handleUserIconClick = () => {
    navigate("/auth");
  };

  const handleMyBookingsClick = () => {
    navigate("/mis-citas");
  };

  const handleProfileClick = () => {
    navigate("/perfil");
  };

  const handleMessagesClick = () => {
    navigate("/mensajes");
  };

  const handleAdminClick = () => {
    navigate(`/admin/${tenant.slug}`);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "liquid-glass-solid !border-x-0 !border-t-0 border-b shadow-sm"
          : "border-transparent"
      }`}
      style={{
        paddingTop: "env(safe-area-inset-top)",
        borderColor: isScrolled ? tenant.primary_color || "hsl(var(--border))" : "transparent",
        background: isScrolled
          ? undefined
          : "linear-gradient(180deg, rgba(10, 12, 22, 0.72) 0%, rgba(10, 12, 22, 0.38) 55%, rgba(10, 12, 22, 0) 100%)",
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Salon Logo & Brand Name */}
          <button
            type="button"
            onClick={() => onNavigate("inicio")}
            className="flex items-center gap-2.5 text-left focus:outline-none group touch-manipulation"
            aria-label={`Ir al inicio de ${tenant.name}`}
          >
            {tenant.logo_url && (
              <img
                src={tenant.logo_url}
                alt={tenant.name}
                className={`h-9 md:h-10 w-auto rounded-xl object-contain shadow-sm group-hover:opacity-90 transition-all ${
                  isScrolled ? "" : "drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
                }`}
              />
            )}
            <span
              className={`text-lg md:text-xl font-bold tracking-tight transition-colors duration-300 ${
                isScrolled
                  ? ""
                  : "text-white [text-shadow:_0_2px_10px_rgba(0,0,0,0.85),_0_1px_3px_rgba(0,0,0,0.9)]"
              }`}
              style={{
                color: isScrolled ? tenant.primary_color || "hsl(var(--primary))" : undefined,
                fontFamily: "var(--font-heading)",
              }}
            >
              {tenant.name}
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`text-sm font-medium transition-all duration-300 ${
                  isScrolled
                    ? activeSection === item.id
                      ? "text-primary"
                      : "text-muted-foreground hover:text-primary"
                    : "text-white/95 hover:text-white [text-shadow:_0_1px_6px_rgba(0,0,0,0.85)]"
                }`}
                style={{
                  color:
                    isScrolled && activeSection === item.id ? tenant.primary_color || "hsl(var(--primary))" : undefined,
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Phone, Account & Mobile Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Phone - Icon only on mobile, full on desktop */}
            {tenant.phone && (
              <>
                {/* Mobile: Just icon */}
                <a
                  href={`tel:${tenant.phone}`}
                  className={`sm:hidden flex items-center justify-center h-9 w-9 rounded-full transition-all duration-300 touch-manipulation ${
                    isScrolled
                      ? "bg-primary/10 text-primary hover:bg-primary/20"
                      : "bg-black/40 hover:bg-black/55 text-white backdrop-blur-md border border-white/20 shadow-sm"
                  }`}
                  aria-label="Llamar"
                >
                  <Phone className="h-4 w-4" />
                </a>
                {/* Desktop: Full phone number */}
                <a
                  href={`tel:${tenant.phone}`}
                  className={`hidden sm:flex items-center gap-2 text-sm font-medium transition-colors duration-300 ${
                    isScrolled ? "" : "text-white [text-shadow:_0_1px_6px_rgba(0,0,0,0.85)]"
                  }`}
                  style={{
                    color: isScrolled ? tenant.primary_color || "hsl(var(--primary))" : undefined,
                  }}
                >
                  <Phone className="h-4 w-4" />
                  {tenant.phone}
                </a>
              </>
            )}

            {/* Account Menu */}
            {user ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-9 w-9 rounded-full transition-all duration-300 ${
                      isScrolled
                        ? "text-foreground hover:bg-muted"
                        : "bg-black/40 hover:bg-black/55 text-white backdrop-blur-md border border-white/20 shadow-sm"
                    }`}
                  >
                    <User className="h-4.5 w-4.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95 border-border z-[100]"
                >
                  <DropdownMenuLabel>{t("nav.myAccount")}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleProfileClick}>
                    <User className="h-4 w-4 mr-2" />
                    Mi Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleMyBookingsClick}>
                    <Calendar className="h-4 w-4 mr-2" />
                    {t("nav.myBookings")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleMessagesClick} className="relative">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Mensajes
                    {unreadCount > 0 && (
                      <span className="absolute right-2 min-w-[20px] h-5 flex items-center justify-center bg-destructive text-destructive-foreground text-xs font-bold rounded-full px-1.5">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleAdminClick}>
                        <Shield className="h-4 w-4 mr-2" />
                        Panel Admin
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    {t("nav.signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleUserIconClick}
                className={`h-9 w-9 rounded-full transition-all duration-300 ${
                  isScrolled
                    ? "text-foreground hover:bg-muted"
                    : "bg-black/40 hover:bg-black/55 text-white backdrop-blur-md border border-white/20 shadow-sm"
                }`}
              >
                <User className="h-4.5 w-4.5" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className={`md:hidden h-9 w-9 rounded-full transition-all duration-300 ${
                isScrolled
                  ? "text-foreground hover:bg-muted"
                  : "bg-black/40 hover:bg-black/55 text-white backdrop-blur-md border border-white/20 shadow-sm"
              }`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav
            className={`md:hidden py-4 border-t transition-colors ${
              isScrolled ? "bg-background" : "bg-background/95 backdrop-blur-sm"
            }`}
          >
            <div className="flex flex-col gap-1.5">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`py-2.5 px-4 text-left rounded-xl font-medium transition-colors ${
                    activeSection === item.id ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-muted"
                  }`}
                  style={{
                    color: activeSection === item.id ? tenant.primary_color || "hsl(var(--primary))" : undefined,
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default TenantHeader;
