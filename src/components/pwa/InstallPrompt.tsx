import { useState, useEffect, useCallback } from "react";
import { X, Share, Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
const glowAppLogo = "/icon-192.png";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "glowapp-install-dismissed";
const DISMISS_DAYS = 7;

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true
  );
}

function wasDismissedRecently() {
  const dismissed = localStorage.getItem(DISMISS_KEY);
  if (!dismissed) return false;
  const diff = Date.now() - Number(dismissed);
  return diff < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

function getOS(): "ios" | "android" | "other" {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "other";
}

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [os, setOs] = useState<"ios" | "android" | "other">("other");

  useEffect(() => {
    if (isStandalone() || wasDismissedRecently()) return;

    const detectedOS = getOS();
    setOs(detectedOS);

    if (detectedOS === "ios") {
      // Show after a short delay on iOS
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }

    if (detectedOS === "android") {
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setTimeout(() => setShow(true), 1500);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    }
  }, []);

  const dismiss = useCallback(() => {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-24 left-4 right-4 z-50 safe-bottom"
        >
          <div className="bg-background border border-border rounded-2xl shadow-xl p-4 max-w-md mx-auto">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                {/* App icon */}
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={glowAppLogo} alt="GlowApp" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-sm">Instala GlowApp</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Accede más rápido desde tu pantalla de inicio
                  </p>
                </div>
              </div>
              <button
                onClick={dismiss}
                className="p-1 rounded-full hover:bg-muted transition-colors flex-shrink-0"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {os === "android" && deferredPrompt && (
              <Button
                onClick={handleInstall}
                className="w-full mt-3 rounded-xl gradient-primary border-0"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Instalar app
              </Button>
            )}

            {os === "ios" && (
              <div className="mt-3 bg-muted/50 rounded-xl p-3">
                <p className="text-xs text-foreground font-medium mb-2">Cómo instalar:</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-primary">1</span>
                    </span>
                    <span>Toca el botón</span>
                    <Share className="w-3.5 h-3.5 text-primary inline" />
                    <span>de compartir</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-primary">2</span>
                    </span>
                    <span>Selecciona</span>
                    <Plus className="w-3.5 h-3.5 text-primary inline" />
                    <span>"Añadir a inicio"</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}