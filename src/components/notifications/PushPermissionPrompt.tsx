import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, X } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { motion, AnimatePresence } from "motion/react";

interface PushPermissionPromptProps {
  show: boolean;
  onDismiss: () => void;
}

export function PushPermissionPrompt({ show, onDismiss }: PushPermissionPromptProps) {
  const { permission, isSupported, requestPermission, loading } = usePushNotifications();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if: explicitly requested, supported, and not already granted/denied
    if (show && isSupported && permission === "default") {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
    setVisible(false);
  }, [show, isSupported, permission]);

  const handleActivate = async () => {
    const success = await requestPermission();
    if (success) {
      setVisible(false);
      onDismiss();
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    onDismiss();
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={handleDismiss}
          />
          {/* Bottom sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl shadow-2xl"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)" }}
          >
            <div className="px-5 pt-4 pb-2">
              {/* Handle bar */}
              <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4" />

              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-muted/80 hover:bg-muted"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>

              {/* Icon */}
              <div className="flex justify-center mb-3">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Bell className="h-7 w-7 text-primary" />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-center text-foreground mb-1">
                No te pierdas nada
              </h3>
              <p className="text-sm text-muted-foreground text-center mb-5 max-w-xs mx-auto">
                Recibe alertas de tus citas, recordatorios, mensajes y más directamente en tu móvil.
              </p>

              {/* Buttons */}
              <div className="flex flex-col gap-2.5 mb-2">
                <Button
                  onClick={handleActivate}
                  disabled={loading}
                  className="w-full h-12 rounded-xl text-base font-semibold"
                >
                  {loading ? "Activando..." : "Activar notificaciones"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleDismiss}
                  className="w-full h-10 text-muted-foreground"
                >
                  Ahora no
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
