import { useState, useEffect } from "react";
import { Menu, X, Phone, User, LogOut, Shield, Calendar, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

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
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { unreadCount } = useUnreadMessages();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "stylist"]);
    setIsAdmin(data && data.length > 0);
  };

  const navItems = [
    { id: "inicio", label: "Inicio" },
    { id: "servicios", label: "Servicios" },
    { id: "reserva", label: "Reservar" },
    { id: "resenas", label: "Reseñas" },
    { id: "contacto", label: "Contacto" },
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
      setUser(null);
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
          ? "bg-background/95 backdrop-blur-sm border-b shadow-sm" 
          : "bg-transparent border-transparent"
      }`}
      style={{ 
        borderColor: isScrolled ? (tenant.primary_color || 'hsl(var(--border))') : 'transparent' 
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            {tenant.logo_url ? (
              <img 
                src={tenant.logo_url} 
                alt={tenant.name} 
                className="h-10 w-auto"
              />
            ) : (
              <span 
                className={`text-xl font-bold transition-colors duration-300 ${
                  isScrolled ? "" : "text-white drop-shadow-md"
                }`}
                style={{ 
                  color: isScrolled ? (tenant.primary_color || 'hsl(var(--primary))') : undefined,
                  fontFamily: 'var(--font-heading)'
                }}
              >
                {tenant.name}
              </span>
            )}
          </div>

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
                    : "text-white/90 hover:text-white drop-shadow-md"
                }`}
                style={{ 
                  color: isScrolled && activeSection === item.id 
                    ? (tenant.primary_color || 'hsl(var(--primary))') 
                    : undefined 
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Phone, Account & Mobile Menu */}
          <div className="flex items-center gap-3">
            {tenant.phone && (
              <a 
                href={`tel:${tenant.phone}`}
                className={`hidden sm:flex items-center gap-2 text-sm font-medium transition-colors duration-300 ${
                  isScrolled ? "" : "text-white drop-shadow-md"
                }`}
                style={{ 
                  color: isScrolled ? (tenant.primary_color || 'hsl(var(--primary))') : undefined 
                }}
              >
                <Phone className="h-4 w-4" />
                {tenant.phone}
              </a>
            )}

            {/* Account Menu */}
            {user ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-9 w-9 transition-colors duration-300 ${
                      isScrolled ? "text-foreground" : "text-white hover:text-white/80 hover:bg-white/20"
                    }`}
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95 border-border z-[100]"
                >
                  <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleProfileClick}>
                    <User className="h-4 w-4 mr-2" />
                    Mi Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleMyBookingsClick}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Tus Citas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleMessagesClick} className="relative">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Mensajes
                    {unreadCount > 0 && (
                      <span className="absolute right-2 min-w-[20px] h-5 flex items-center justify-center bg-destructive text-destructive-foreground text-xs font-bold rounded-full px-1.5">
                        {unreadCount > 99 ? '99+' : unreadCount}
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
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleUserIconClick} 
                className={`h-9 w-9 transition-colors duration-300 ${
                  isScrolled ? "text-foreground" : "text-white hover:text-white/80 hover:bg-white/20"
                }`}
              >
                <User className="h-5 w-5" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className={`md:hidden transition-colors duration-300 ${
                isScrolled ? "" : "text-white hover:bg-white/20"
              }`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className={`md:hidden py-4 border-t transition-colors ${
            isScrolled ? "bg-background" : "bg-background/95 backdrop-blur-sm"
          }`}>
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`py-2 px-4 text-left rounded-lg transition-colors ${
                    activeSection === item.id 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-muted"
                  }`}
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