import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HelpCircle, MessageCircle, Mail, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SupportButtonProps {
  variant?: "floating" | "inline" | "card";
  context?: string;
}

export function SupportButton({ variant = "floating", context }: SupportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const supportEmail = "soporte@glowapp.es";
  const whatsappNumber = "34600000000"; // Reemplazar con número real

  const handleEmailClick = () => {
    const subject = context 
      ? `Ayuda con: ${context}` 
      : "Necesito ayuda con GlowApp";
    window.location.href = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}`;
  };

  const handleWhatsappClick = () => {
    const message = context 
      ? `Hola, necesito ayuda con: ${context}` 
      : "Hola, necesito ayuda con GlowApp";
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank");
  };

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <HelpCircle className="h-4 w-4" />
        <span>¿Necesitas ayuda?</span>
        <button
          onClick={handleEmailClick}
          className="text-primary hover:underline font-medium"
        >
          Contáctanos
        </button>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className="ios-card p-4 bg-muted/30 border-dashed">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <HelpCircle className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-foreground text-sm mb-1">
              ¿Necesitas ayuda?
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              Nuestro equipo está disponible para resolver tus dudas
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleEmailClick}
                className="h-8 text-xs rounded-lg"
              >
                <Mail className="h-3.5 w-3.5 mr-1.5" />
                Email
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleWhatsappClick}
                className="h-8 text-xs rounded-lg text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              >
                <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Floating variant
  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-4 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center"
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring" }}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="h-5 w-5" />
            </motion.div>
          ) : (
            <motion.div
              key="help"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <HelpCircle className="h-5 w-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Support Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-40 right-4 z-50 w-72 ios-card p-4 shadow-xl"
              style={{ marginBottom: "env(safe-area-inset-bottom)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-full bg-primary/10">
                  <HelpCircle className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">¿Necesitas ayuda?</h3>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Estamos aquí para ayudarte. Elige cómo prefieres contactarnos:
              </p>

              <div className="space-y-2">
                <Button
                  onClick={handleEmailClick}
                  variant="outline"
                  className="w-full justify-start h-11 rounded-xl"
                >
                  <Mail className="h-4 w-4 mr-3 text-primary" />
                  <div className="text-left">
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-[10px] text-muted-foreground">{supportEmail}</p>
                  </div>
                </Button>

                <Button
                  onClick={handleWhatsappClick}
                  variant="outline"
                  className="w-full justify-start h-11 rounded-xl border-emerald-200 hover:bg-emerald-50"
                >
                  <MessageCircle className="h-4 w-4 mr-3 text-emerald-600" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-emerald-700">WhatsApp</p>
                    <p className="text-[10px] text-muted-foreground">Respuesta rápida</p>
                  </div>
                  <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                </Button>
              </div>

              <p className="text-[10px] text-center text-muted-foreground mt-4">
                Lunes a Viernes, 9:00 - 18:00
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
