import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Menu, User, LogOut, Shield, Home, Scissors, Calendar, ImageIcon, Star, Info, Phone } from "lucide-react";
import logo from "@/assets/logo.png";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
interface HeaderProps {
  onNavigate: (section: string) => void;
  activeSection: string;
}
export const Header = ({
  onNavigate,
  activeSection
}: HeaderProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
      }
    });
    const {
      data: {
        subscription
      }
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
    const {
      data
    } = await supabase.from("user_roles").select("role").eq("user_id", userId).in("role", ["admin", "stylist"]);
    setIsAdmin(data && data.length > 0);
  };
  const navItems = [{
    id: "inicio",
    label: "Inicio",
    path: "/",
    icon: Home
  }, {
    id: "servicios",
    label: "Servicios",
    path: "/#servicios",
    icon: Scissors
  }, {
    id: "reserva",
    label: "Reserva Online",
    path: "/#reserva",
    icon: Calendar
  }, {
    id: "galeria",
    label: "Galería",
    path: "/#galeria",
    icon: ImageIcon
  }, {
    id: "resenas",
    label: "Reseñas",
    path: "/#resenas",
    icon: Star
  }, {
    id: "sobre-nosotras",
    label: "Sobre Nosotras",
    path: "/sobre-nosotras",
    icon: Info
  }, {
    id: "contacto",
    label: "Contacto",
    path: "/#contacto",
    icon: Phone
  }];
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };
  const handleUserIconClick = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
    if (user) {
      setTimeout(() => navigate("/mis-citas"), 300);
    } else {
      setTimeout(() => navigate("/auth"), 300);
    }
  };
  const handleMyBookingsClick = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
    setTimeout(() => navigate("/mis-citas"), 300);
  };
  const handleProfileClick = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
    setTimeout(() => navigate("/perfil"), 300);
  };
  const handleAdminClick = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
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
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
      setTimeout(() => navigate(item.path), 300);
    }
    setMenuOpen(false);
  };
  // Determinar si el header debe ser transparente (solo en home sin scroll)
  const isHomePage = location.pathname === '/';
  const isTransparent = isHomePage && !scrolled;
  return <header className={`fixed top-0 left-0 right-0 z-50 w-full pt-[env(safe-area-inset-top)] transition-all duration-300 ${!isTransparent ? 'border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60' : 'bg-transparent'}`}>
      {" "}
      
    </header>;
};