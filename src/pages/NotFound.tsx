import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Search, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* 404 Display */}
        <div className="relative">
          <h1 className="text-[120px] font-black text-primary/10 leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Search className="w-12 h-12 text-primary-foreground" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-foreground">
            Página no encontrada
          </h2>
          <p className="text-muted-foreground">
            La página que buscas no existe o ha sido movida. 
            Vuelve al inicio para descubrir los mejores salones.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button asChild size="lg" className="gap-2">
            <Link to="/">
              <Home className="w-4 h-4" />
              Ir al inicio
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="gap-2"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4" />
            Volver atrás
          </Button>
        </div>

        {/* Brand */}
        <p className="text-xs text-muted-foreground pt-8">
          GlowApp • Red social de belleza y bienestar
        </p>
      </div>
    </div>
  );
};

export default NotFound;