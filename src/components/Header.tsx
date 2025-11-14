import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User, LogOut, Shield } from "lucide-react";
import logo from "@/assets/logo.png";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BUSINESS_INFO } from "@/config/businessInfo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onNavigate: (section: string) => void;
  activeSection: string;
}

export const Header = ({ onNavigate, activeSection }: HeaderProps) => {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
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
      const heroHeight = window.innerHeight * 0.8;
      setIsScrolled(window.scrollY > heroHeight);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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
    { id: "inicio", label: "Inicio", path: "/" },
    { id: "servicios", label: "Servicios", path: "/#servicios" },
    { id: "reserva", label: "Reserva Online", path: "/#reserva" },
    { id: "galeria", label: "Galería", path: "/#galeria" },
    { id: "resenas", label: "Reseñas", path: "/#resenas" },
    { id: "sobre-nosotras", label: "Sobre Nosotras", path: "/sobre-nosotras" },
    { id: "contacto", label: "Contacto", path: "/#contacto" },
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
    setOpen(false);

    if (item.path.startsWith("/#")) {
      const section = item.path.replace("/#", "");

      if (location.pathname !== "/") {
        navigate("/");
        setTimeout(() => {
          onNavigate(section);
          const element = document.getElementById(section);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 100);
      } else {
        onNavigate(section);
        const element = document.getElementById(section);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => navigate(item.path), 300);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] w-full border-b transition-all duration-300 pt-[env(safe-area-inset-top)] ${
        isScrolled
          ? "bg-[#3b2b30] text-white border-[#3b2b30] shadow-lg"
          : "bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/95"
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
            if (location.pathname !== "/") {
              setTimeout(() => navigate("/"), 300);
            }
          }}
        >
          <img src={logo} alt={BUSINESS_INFO.name} className="h-10 w-auto" />
          <div className="flex flex-col">
            <span className={`font-playfair font-bold text-lg leading-tight ${isScrolled ? "text-white" : ""}`}>
              {BUSINESS_INFO.name}
            </span>
            <span className={`text-xs leading-tight ${isScrolled ? "text-white/80" : "text-muted-foreground"}`}>
              Peluquería y Estética
            </span>
          </div>
        </div>

        {/* Desktop Navigation - Dropdown Menu */}
        <div className="hidden md:flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={`gap-2 ${isScrolled ? "text-white hover:bg-white/10 hover:text-white" : ""}`}
              >
                <Menu className="h-5 w-5" />
                <span className="text-sm font-medium">Menú</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-background/95 backdrop-blur-md border-[hsl(var(--salon-pink-light))]z-[101]"
            >
              {navItems.map((item, index) => (
                <div key={item.id}>
                  <DropdownMenuItem
                    onClick={() => handleNavClick(item)}
                    className={`cursor-pointer ${
                      activeSection === item.id
                        ? "bg-[hsl(var(--salon-pink-light))] text-[hsl(var(--salon-pink))] font-medium"
                        : "hover:bg-[hsl(var(--salon-pink-light))]/50"
                    }`}
                  >
                    {item.label}
                  </DropdownMenuItem>
                  {index < navItems.length - 1 && <DropdownMenuSeparator />}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={isScrolled ? "text-white hover:bg-white/10 hover:text-white" : ""}
                >
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-background/95 backdrop-blur-md border-[hsl(var(--salon-pink-light))]z-[101]"
              >
                <DropdownMenuItem onClick={handleProfileClick} className="hover:bg-[hsl(var(--salon-pink-light))]/50">
                  <User className="mr-2 h-4 w-4" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleMyBookingsClick}
                  className="hover:bg-[hsl(var(--salon-pink-light))]/50"
                >
                  Mis Citas
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={handleAdminClick} className="hover:bg-[hsl(var(--salon-pink-light))]/50">
                    <Shield className="mr-2 h-4 w-4" />
                    Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="hover:bg-destructive/10 text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleUserIconClick}
              className={isScrolled ? "text-white hover:bg-white/10 hover:text-white" : ""}
            >
              <User className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="flex md:hidden items-center gap-2">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-9 w-9 ${isScrolled ? "text-white hover:bg-white/10 hover:text-white" : ""}`}
                >
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-background/95 backdrop-blur-md border-[hsl(var(--salon-pink-light))]z-[101]"
              >
                <DropdownMenuItem onClick={handleProfileClick} className="hover:bg-[hsl(var(--salon-pink-light))]/50">
                  <User className="mr-2 h-4 w-4" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleMyBookingsClick}
                  className="hover:bg-[hsl(var(--salon-pink-light))]/50"
                >
                  Mis Citas
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={handleAdminClick} className="hover:bg-[hsl(var(--salon-pink-light))]/50">
                    <Shield className="mr-2 h-4 w-4" />
                    Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="hover:bg-destructive/10 text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={isScrolled ? "text-white hover:bg-white/10 hover:text-white" : ""}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4 mt-8">
                {navItems.map((item) => (
                  <Button
                    key={item.id}
                    variant={activeSection === item.id ? "secondary" : "ghost"}
                    onClick={() => handleNavClick(item)}
                    className="justify-start text-base"
                  >
                    {item.label}
                  </Button>
                ))}

                {!user && (
                  <div className="border-t pt-4 mt-4">
                    <Button variant="ghost" onClick={handleUserIconClick} className="justify-start text-base w-full">
                      <User className="mr-2 h-5 w-5" />
                      Iniciar Sesión
                    </Button>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
