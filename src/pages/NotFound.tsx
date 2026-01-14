import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Home, Search, Sparkles, CalendarDays, MessageCircle, User } from "lucide-react";
import { motion } from "framer-motion";
import glowAppLogo from "@/assets/glowapp-logo.png";

const popularPages = [
  { name: "Explorar Salones", href: "/", icon: Sparkles },
  { name: "Mis Reservas", href: "/mis-reservas", icon: CalendarDays },
  { name: "Mensajes", href: "/mensajes", icon: MessageCircle },
  { name: "Mi Perfil", href: "/perfil", icon: User },
];

const NotFound = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20 flex items-center justify-center p-4"
      style={{ 
        paddingTop: 'max(1rem, env(safe-area-inset-top))', 
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' 
      }}
    >
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <img 
            src={glowAppLogo} 
            alt="GlowApp" 
            className="h-10 mx-auto mb-6 rounded-xl"
          />
        </motion.div>

        {/* Ilustración animada */}
        <motion.div 
          className="relative"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="text-[140px] font-black text-primary/5 leading-none select-none">
            404
          </div>
          <motion.div 
            className="absolute inset-0 flex items-center justify-center"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-28 h-28 rounded-3xl gradient-primary flex items-center justify-center shadow-lg glow-primary">
              <Search className="w-14 h-14 text-primary-foreground" />
            </div>
          </motion.div>
        </motion.div>

        {/* Mensaje */}
        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h1 className="text-3xl font-bold text-foreground">
            ¡Ups! Página no encontrada
          </h1>
          <p className="text-muted-foreground text-lg">
            No encontramos lo que buscas, pero puedes explorar nuestros salones o buscar directamente.
          </p>
        </motion.div>

        {/* Búsqueda integrada */}
        <motion.form 
          onSubmit={handleSearch}
          className="relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar salones, servicios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-24 h-14 text-base rounded-2xl border-2 border-border/50 focus:border-primary bg-card shadow-sm"
            />
            <Button 
              type="submit" 
              size="sm" 
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl"
            >
              Buscar
            </Button>
          </div>
        </motion.form>

        {/* Sugerencias de páginas populares */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <p className="text-sm text-muted-foreground font-medium">
            Páginas populares
          </p>
          <div className="grid grid-cols-2 gap-3">
            {popularPages.map((page, index) => (
              <motion.div
                key={page.href}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
              >
                <Link
                  to={page.href}
                  className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:bg-secondary/50 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <page.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {page.name}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Botón principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Button asChild size="lg" className="w-full h-14 text-base rounded-2xl gap-2">
            <Link to="/">
              <Home className="w-5 h-5" />
              Volver al inicio
            </Link>
          </Button>
        </motion.div>

        {/* Brand */}
        <motion.p 
          className="text-xs text-muted-foreground pt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          GlowApp • La red social de belleza y bienestar
        </motion.p>
      </div>
    </div>
  );
};

export default NotFound;
