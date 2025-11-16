import { Button } from "@/components/ui/button";
import { Menu, User, LogOut, Shield, Home, Scissors, Calendar, ImageIcon, Star, Info, Phone } from "lucide-react";
import logo from "@/assets/logo.png";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onNavigate: (section: string) => void;
  activeSection: string;
}

export const Header = ({ onNavigate, activeSection }: HeaderProps) => {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
    { id: "inicio", label: "Inicio", path: "/", icon: Home },
    { id: "servicios", label: "Servicios", path: "/#servicios", icon: Scissors },
    { id: "reserva", label: "Reserva Online", path: "/#reserva", icon: Calendar },
    { id: "galeria", label: "Galería", path: "/#galeria", icon: ImageIcon },
    { id: "resenas", label: "Reseñas", path: "/#resenas", icon: Star },
    { id: "sobre-nosotras", label: "Sobre Nosotras", path: "/sobre-nosotras", icon: Info },
    { id: "contacto", label: "Contacto", path: "/#contacto", icon: Phone },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleUserIconClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (user) {
      setTimeout(() => navigate("/mis-citas"), 300);
    } else {
      setTimeout(() => navigate("/auth"), 300);
    }
  };

  const handleMyBookingsClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => navigate("/mis-citas"), 300);
  };

  const handleProfileClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => navigate("/perfil"), 300);
  };

  const handleAdminClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => navigate("/admin"), 300);
  };

  const handleNavClick = (item: (typeof navItems)[0]) => {
    if (item.path.startsWith("/#")) {
      if (location.pathname !== "/") {
        navigate("/");
        setTimeout(() => {
          const section = item.path.replace("/#", "");
          onNavigate(section);
        }, 100);
      } else {
        const section = item.path.replace("/#", "");
        onNavigate(section);
      }
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => navigate(item.path), 300);
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 w-full pt-[env(safe-area-inset-top)] transition-all duration-300 ${
      scrolled 
        ? 'border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60' 
        : 'bg-transparent'
    }`}>
      {" "}
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div
          className="flex items-center gap-3 cursor-pointer transition-opacity hover:opacity-80"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
            setTimeout(() => {
              navigate("/");
              onNavigate("inicio");
            }, 300);
          }}
        >
          <img src={logo} alt={import.meta.env.VITE_BUSINESS_NAME} className="h-12 w-auto" />
          <span className="text-xl font-semibold text-foreground">{import.meta.env.VITE_BUSINESS_NAME}</span>
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className={`gap-2 transition-all duration-300 ${
                  scrolled ? 'text-foreground' : 'text-foreground'
                }`}
              >
                <Menu className="h-5 w-5" />
                <span className="font-medium">Menú</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-56 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95 border-border z-[100]"
            >
              <DropdownMenuLabel>Navegación</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {navItems.map((item) => (
                <DropdownMenuItem 
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={`gap-3 cursor-pointer ${
                    activeSection === item.id ? 'bg-accent text-accent-foreground font-medium' : ''
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95 border-border z-[100]">
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
            <Button variant="ghost" size="icon" onClick={handleUserIconClick} className="h-9 w-9">
              <User className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
