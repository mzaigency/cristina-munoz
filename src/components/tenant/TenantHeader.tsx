import { useState } from "react";
import { Menu, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Tenant {
  id: string;
  name: string;
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

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b"
      style={{ borderColor: tenant.primary_color || 'hsl(var(--border))' }}
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
                className="text-xl font-bold"
                style={{ color: tenant.primary_color || 'hsl(var(--primary))' }}
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
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  activeSection === item.id ? "text-primary" : "text-muted-foreground"
                }`}
                style={{ 
                  color: activeSection === item.id 
                    ? (tenant.primary_color || 'hsl(var(--primary))') 
                    : undefined 
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Phone & Mobile Menu */}
          <div className="flex items-center gap-4">
            {tenant.phone && (
              <a 
                href={`tel:${tenant.phone}`}
                className="hidden sm:flex items-center gap-2 text-sm font-medium"
                style={{ color: tenant.primary_color || 'hsl(var(--primary))' }}
              >
                <Phone className="h-4 w-4" />
                {tenant.phone}
              </a>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t">
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
