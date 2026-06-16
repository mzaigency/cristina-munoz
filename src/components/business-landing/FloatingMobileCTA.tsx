import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * CTA persistente en mobile. No se puede descartar — siempre disponible una
 * vez el usuario hace scroll. Incluye microcopy de confianza (gratis · sin
 * tarjeta · pagos seguros) para reducir fricción.
 */
export const FloatingMobileCTA = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 500);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 px-3 md:hidden pointer-events-none"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <div className="pointer-events-auto liquid-glass-solid rounded-[24px] p-3 flex flex-col gap-2 shadow-2xl">
            <Button
              className="w-full rounded-full gradient-primary border-0 h-12 text-base font-semibold"
              onClick={() => navigate("/onboarding")}
            >
              Empezar gratis
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="w-3 h-3 text-primary" />
              1er mes gratis · Sin permanencia · Pagos seguros con Stripe
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
