import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star, Heart, CalendarPlus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRecentBooking } from "@/hooks/useRecentBooking";

interface PostVisitCardProps {
  tenantId: string;
  tenantSlug: string;
}

/**
 * Tarjeta flotante mostrada tras una visita reciente (< 6h) del usuario logueado.
 * CTAs: reseña, seguir/reservar próxima cita.
 */
export const PostVisitCard = ({ tenantId, tenantSlug }: PostVisitCardProps) => {
  const booking = useRecentBooking(tenantId);
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!booking) return;
    const key = `glowapp_postvisit_dismissed_${booking.id}`;
    if (sessionStorage.getItem(key)) return;
    const t = setTimeout(() => setShow(true), 1400);
    return () => clearTimeout(t);
  }, [booking]);

  if (!booking) return null;

  const dismiss = () => {
    sessionStorage.setItem(`glowapp_postvisit_dismissed_${booking.id}`, "1");
    setShow(false);
  };

  const openReview = () => {
    navigate(`/review/${booking.id}`);
    dismiss();
  };

  const openBooking = () => {
    window.dispatchEvent(new CustomEvent("glow:open-booking"));
    dismiss();
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", damping: 24, stiffness: 260 }}
          className="fixed left-3 right-3 z-[65]"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 92px)" }}
        >
          <div className="mx-auto max-w-md rounded-2xl bg-white/95 backdrop-blur-xl shadow-2xl border border-neutral-200/60 overflow-hidden">
            <div
              className="px-4 py-2.5 flex items-center justify-between text-white text-xs font-semibold"
              style={{ background: "linear-gradient(100deg, #22408c, #98329a)" }}
            >
              <span>✨ ¡Gracias por tu visita!</span>
              <button
                onClick={dismiss}
                aria-label="Cerrar"
                className="grid place-items-center w-6 h-6 rounded-full hover:bg-white/15 transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {booking.services.length > 0 && (
                <p className="text-[13px] text-neutral-600">
                  {booking.services.slice(0, 2).join(", ")}
                  {booking.services.length > 2 && "…"}
                </p>
              )}
              <div className="grid grid-cols-2 gap-2">
                {!booking.hasReview && (
                  <button
                    onClick={openReview}
                    className="col-span-2 h-11 rounded-xl text-[13.5px] font-semibold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition"
                    style={{ background: "linear-gradient(100deg, #22408c, #98329a)" }}
                  >
                    <Star className="h-4 w-4" />
                    Deja tu reseña
                  </button>
                )}
                <button
                  onClick={openBooking}
                  className="h-11 rounded-xl text-[13px] font-semibold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center gap-1.5 active:scale-[0.98] transition"
                >
                  <CalendarPlus className="h-3.5 w-3.5" />
                  Repetir
                </button>
                <button
                  onClick={dismiss}
                  className="h-11 rounded-xl text-[13px] font-semibold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center gap-1.5 active:scale-[0.98] transition"
                >
                  <Heart className="h-3.5 w-3.5" />
                  Seguir salón
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
