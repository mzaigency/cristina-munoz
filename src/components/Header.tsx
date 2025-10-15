import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import logo from "@/assets/logo.png";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface HeaderProps {
  onNavigate: (section: string) => void;
  activeSection: string;
}

export const Header = ({ onNavigate, activeSection }: HeaderProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    { id: "inicio", label: "Inicio", path: "/" },
    { id: "servicios", label: "Servicios", path: "/#servicios" },
    { id: "galeria", label: "Galería", path: "/#galeria" },
    { id: "sobre-nosotras", label: "Sobre Nosotras", path: "/sobre-nosotras" },
    { id: "reserva", label: "Reserva Online", path: "/#reserva" },
    { id: "cancelar", label: "Cancelar Cita", path: "/#cancelar" },
    { id: "contacto", label: "Contacto", path: "/#contacto" },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
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
      navigate(item.path);
    }
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Cristina Muñoz" className="h-12 w-auto" />
          <span className="text-xl font-semibold text-foreground">Cristina Muñoz</span>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={activeSection === item.id ? "secondary" : "ghost"}
              onClick={() => handleNavClick(item)}
              className="text-sm transition-all hover:scale-105"
            >
              {item.label}
            </Button>
          ))}
        </nav>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              className="md:hidden"
              variant="ghost"
              size="icon"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[250px] sm:w-[300px]">
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
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};
