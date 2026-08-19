import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, X, CalendarPlus } from "lucide-react";

interface QrWelcomeBannerProps {
  tenantName: string;
}

const STORAGE_KEY = "glowapp_qr_banner_dismissed";

export const QrWelcomeBanner = ({ tenantName }: QrWelcomeBannerProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    const t = setTimeout(() => setShow(true), 400);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setShow(false);
  };

  const openBooking = () => {
    window.dispatchEvent(new CustomEvent("glow:open-booking"));
    dismiss();
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: "spring", damping: 22, stiffness: 260 }}
          className="fixed left-3 right-3 z-[70]"
          style={{ top: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
        >
          <div
            className="mx-auto max-w-md rounded-2xl shadow-2xl border border-white/20 backdrop-blur-xl px-4 py-3 flex items-center gap-3"
            style={{ background: "linear-gradient(100deg, #22408C, #98329A)" }}
          >
            <div className="grid place-items-center w-9 h-9 rounded-full bg-white/20 shrink-0">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0 text-white">
              <p className="text-[13px] font-semibold leading-tight">
                ¡Gracias por escanear!
              </p>
              <p className="text-[11px] text-white/85 leading-tight mt-0.5 truncate">
                Reserva en {tenantName} en 1 minuto ✨
              </p>
            </div>
            <button
              onClick={openBooking}
              className="shrink-0 h-9 px-3 rounded-xl bg-white text-[13px] font-semibold text-neutral-900 flex items-center gap-1.5 active:scale-95 transition"
            >
              <CalendarPlus className="h-3.5 w-3.5" />
              Reservar
            </button>
            <button
              onClick={dismiss}
              aria-label="Cerrar"
              className="shrink-0 grid place-items-center w-7 h-7 rounded-full text-white/80 hover:bg-white/10 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
