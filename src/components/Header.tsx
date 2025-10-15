import { Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onNavigate: (section: string) => void;
  activeSection: string;
}

export const Header = ({ onNavigate, activeSection }: HeaderProps) => {
  const navItems = [
    { id: "inicio", label: "Inicio" },
    { id: "servicios", label: "Servicios" },
    { id: "reserva", label: "Reserva Online" },
    { id: "cancelar", label: "Cancelar Cita" },
    { id: "contacto", label: "Contacto" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
            <Scissors className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-foreground">Peluquería Cris</span>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={activeSection === item.id ? "secondary" : "ghost"}
              onClick={() => onNavigate(item.id)}
              className="text-sm"
            >
              {item.label}
            </Button>
          ))}
        </nav>

        <Button
          className="md:hidden"
          variant="ghost"
          size="sm"
          onClick={() => onNavigate(activeSection === "inicio" ? "reserva" : "inicio")}
        >
          Reservar
        </Button>
      </div>
    </header>
  );
};
