import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppVersion } from "@/hooks/useAppVersion";

export function UpdatePrompt() {
  const [swNeedRefresh, setSwNeedRefresh] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const { updateAvailable, acceptUpdate, dismissUpdate } = useAppVersion();

  const needRefresh = swNeedRefresh || updateAvailable;

  useEffect(() => {
    // Solo escuchamos eventos explícitos de SW (vite-plugin-pwa). No recargamos
    // automáticamente en controllerchange porque el SW de Firebase Messaging
    // dispara ese evento al recibir tokens y provocaba reloads y prompts repetidos.
    const handleUpdate = () => setSwNeedRefresh(true);
    window.addEventListener('swUpdated', handleUpdate);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        // Ignoramos el SW de Firebase: no queremos pedirle "update" cada minuto
        if (reg.active?.scriptURL?.includes('firebase-messaging-sw')) return;
        setRegistration(reg);
      }).catch(() => {});
    }

    return () => { window.removeEventListener('swUpdated', handleUpdate); };
  }, []);

  useEffect(() => {
    if (!registration) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        registration.update().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [registration]);

  const handleUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    acceptUpdate();
  };

  const handleDismiss = () => {
    setSwNeedRefresh(false);
    dismissUpdate();
  };

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80"
        >
          <div className="bg-card border border-border rounded-2xl shadow-xl p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <RefreshCw className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground text-sm">
                  Nueva versión disponible
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Actualiza para obtener las últimas mejoras
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={handleDismiss} className="flex-1">
                Más tarde
              </Button>
              <Button size="sm" onClick={handleUpdate} className="flex-1">
                Actualizar
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
