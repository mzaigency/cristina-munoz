import { CalendarPlus } from "lucide-react";
import { useT } from "@/lib/tenantI18n";

interface TenantBookBarProps {
  onBookNow: () => void;
  /** Precio mínimo de servicio, para el gancho "desde X €" (opcional) */
  fromPrice?: number | null;
}

/**
 * Barra de reserva fija (solo móvil): la acción de reservar siempre a un
 * toque mientras se hace scroll. CTA en el gradiente de marca Glowapp.
 * Se oculta en desktop vía CSS (.tv-bookbar).
 */
export function TenantBookBar({ onBookNow, fromPrice }: TenantBookBarProps) {
  const t = useT();
  const formattedFrom =
    fromPrice != null && fromPrice > 0 ? `${t("booking.from")} ${Math.round(fromPrice)} €` : null;

  return (
    <div className="tv-bookbar">
      <div className="min-w-0 flex-1">
        {formattedFrom && <div className="text-[12px] text-neutral-500 font-body">{formattedFrom}</div>}
        <div className="truncate text-[13px] font-semibold text-neutral-800 font-body">{t("bookbar.sub")}</div>
      </div>
      <button className="tv-cta shrink-0" onClick={onBookNow} style={{ padding: "11px 20px" }}>
        <CalendarPlus className="h-4 w-4" />
        {t("hero.bookNow")}
      </button>
    </div>
  );
}

export default TenantBookBar;
