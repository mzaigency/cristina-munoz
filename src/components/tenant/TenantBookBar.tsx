import { CalendarPlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/tenantI18n";

interface TenantBookBarProps {
  onBookNow: () => void;
  /** Precio mínimo de servicio, para el gancho "desde X €" (opcional) */
  fromPrice?: number | null;
}

/**
 * Barra de reserva fija (solo móvil): la acción de reservar siempre a un
 * toque mientras se hace scroll. Se oculta al bajar (para ver contenido)
 * y reaparece al subir (patrón iOS Safari).
 */
export function TenantBookBar({ onBookNow, fromPrice }: TenantBookBarProps) {
  const t = useT();
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      // Solo empieza a esconderse tras 120px de scroll
      if (y < 120) {
        setHidden(false);
      } else if (y > lastY.current + 6) {
        setHidden(true);
      } else if (y < lastY.current - 6) {
        setHidden(false);
      }
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const formattedFrom =
    fromPrice != null && fromPrice > 0 ? `${t("booking.from")} ${Math.round(fromPrice)} €` : null;

  return (
    <div
      className="tv-bookbar"
      style={{
        transform: hidden ? "translateY(120%)" : "translateY(0)",
        transition: "transform 320ms cubic-bezier(0.23, 1, 0.32, 1)",
      }}
    >
      <div className="min-w-0 flex-1">
        {formattedFrom && (
          <div className="text-[12px] font-semibold text-neutral-700 font-body">{formattedFrom}</div>
        )}
        <div className="truncate text-[13px] text-neutral-600 font-body">{t("bookbar.sub")}</div>
      </div>
      <button
        className="tv-cta shrink-0"
        onClick={onBookNow}
        aria-label={t("hero.bookNow")}
        style={{ padding: "12px 22px", minHeight: 48 }}
      >
        <CalendarPlus className="h-4 w-4" />
        {t("hero.bookNow")}
      </button>
    </div>
  );
}

export default TenantBookBar;
