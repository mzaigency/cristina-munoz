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
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={isIOS ? handleDismiss : handleInstall}
        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full p-3 shadow-lg transition-all hover:scale-105 group relative"
        aria-label="Instalar aplicación"
      >
        <Download className="h-5 w-5" />
        <div className="absolute bottom-full right-0 mb-2 w-48 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {isIOS ? "Toca para ver cómo instalar" : "Instalar aplicación"}
        </div>
      </button>
      
      <button
        onClick={handleDismiss}
        className="absolute -top-1 -right-1 bg-background border border-border rounded-full p-1 hover:bg-muted transition-colors"
        aria-label="Cerrar"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
};
