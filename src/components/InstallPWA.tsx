import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);
    
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // For iOS, show install banner if not in standalone mode
    if (iOS && !standalone) {
      setShowInstall(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstall(false);
    // Remember dismissal for iOS users (optional - stores for 7 days)
    if (isIOS) {
      localStorage.setItem('ios-install-dismissed', Date.now().toString());
    }
  };

  useEffect(() => {
    // Check if iOS user has dismissed recently (within 7 days)
    if (isIOS) {
      const dismissed = localStorage.getItem('ios-install-dismissed');
      if (dismissed) {
        const dismissedTime = parseInt(dismissed);
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - dismissedTime < sevenDays) {
          setShowInstall(false);
        }
      }
    }
  }, [isIOS]);

  if (!showInstall || isStandalone) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 pr-6">
            <h3 className="font-semibold text-sm mb-1">Instalar aplicación</h3>
            {isIOS ? (
              <>
                <p className="text-xs text-muted-foreground mb-2">
                  Instala la app en tu iPhone para acceso rápido:
                </p>
                <ol className="text-xs text-muted-foreground space-y-1 mb-3 list-decimal list-inside">
                  <li>Toca el botón <strong>Compartir</strong> <span className="inline-block">⬆️</span></li>
                  <li>Selecciona <strong>"Añadir a pantalla de inicio"</strong></li>
                  <li>Toca <strong>"Añadir"</strong></li>
                </ol>
                <Button onClick={handleDismiss} size="sm" variant="outline" className="w-full">
                  Entendido
                </Button>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-3">
                  Instala nuestra app en tu teléfono para un acceso rápido y reservas más fáciles
                </p>
                <Button onClick={handleInstall} size="sm" className="w-full">
                  Instalar ahora
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
