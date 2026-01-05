import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home, MessageCircle, WifiOff, Bug, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import glowAppLogo from "@/assets/glowapp-logo.png";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorType: "network" | "auth" | "general" | "unknown";
}

const errorConfigs = {
  network: {
    icon: WifiOff,
    title: "Sin conexión",
    description: "Parece que no tienes conexión a internet. Verifica tu conexión e intenta de nuevo.",
    suggestion: "Revisa tu WiFi o datos móviles",
    color: "warning",
  },
  auth: {
    icon: ShieldAlert,
    title: "Sesión expirada",
    description: "Tu sesión ha expirado por seguridad. Inicia sesión de nuevo para continuar.",
    suggestion: "Vuelve a iniciar sesión",
    color: "primary",
  },
  general: {
    icon: Bug,
    title: "Algo salió mal",
    description: "Ha ocurrido un error inesperado. Nuestro equipo ya fue notificado.",
    suggestion: "Intenta recargar la página",
    color: "destructive",
  },
  unknown: {
    icon: AlertTriangle,
    title: "Error desconocido",
    description: "Ocurrió un problema que no pudimos identificar. Intenta de nuevo.",
    suggestion: "Recarga o vuelve al inicio",
    color: "destructive",
  },
};

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorType: "unknown",
  };

  public static getDerivedStateFromError(error: Error): State {
    // Detectar tipo de error
    let errorType: State["errorType"] = "general";
    
    const message = error.message.toLowerCase();
    if (message.includes("network") || message.includes("fetch") || message.includes("offline")) {
      errorType = "network";
    } else if (message.includes("auth") || message.includes("unauthorized") || message.includes("401")) {
      errorType = "auth";
    } else if (message.includes("undefined") || message.includes("null")) {
      errorType = "general";
    }

    return { hasError: true, error, errorType };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error capturado por ErrorBoundary:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  private handleContact = () => {
    window.location.href = "mailto:soporte@glowapp.app?subject=Error en la app";
  };

  public render() {
    if (this.state.hasError) {
      const config = errorConfigs[this.state.errorType];
      const IconComponent = config.icon;
      
      return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6">
            {/* Logo */}
            <motion.img
              src={glowAppLogo}
              alt="GlowApp"
              className="h-8 mx-auto"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            />

            {/* Icon animado */}
            <motion.div 
              className={`mx-auto w-24 h-24 rounded-3xl bg-${config.color}/10 flex items-center justify-center`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <IconComponent className={`w-12 h-12 text-${config.color}`} />
              </motion.div>
            </motion.div>

            {/* Mensaje */}
            <motion.div 
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-2xl font-bold text-foreground">
                {config.title}
              </h1>
              <p className="text-muted-foreground">
                {config.description}
              </p>
              
              {/* Sugerencia */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-sm text-muted-foreground">
                <span>💡</span>
                <span>{config.suggestion}</span>
              </div>
            </motion.div>

            {/* Error details (development only) */}
            {import.meta.env.DEV && this.state.error && (
              <motion.div 
                className="bg-muted/50 rounded-xl p-4 text-left border border-border/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-xs font-mono text-muted-foreground break-all">
                  {this.state.error.message}
                </p>
              </motion.div>
            )}

            {/* Actions */}
            <motion.div 
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button onClick={this.handleReload} className="w-full h-12 gap-2 rounded-xl">
                <RefreshCw className="w-4 h-4" />
                Recargar página
              </Button>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={this.handleGoHome} 
                  className="flex-1 h-12 gap-2 rounded-xl"
                >
                  <Home className="w-4 h-4" />
                  Inicio
                </Button>
                <Button 
                  variant="outline" 
                  onClick={this.handleContact} 
                  className="flex-1 h-12 gap-2 rounded-xl"
                >
                  <MessageCircle className="w-4 h-4" />
                  Contactar
                </Button>
              </div>
            </motion.div>

            {/* Brand */}
            <motion.p 
              className="text-xs text-muted-foreground pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              GlowApp • La red social de belleza y bienestar
            </motion.p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
