import { Star, MapPin, Clock, Calendar } from "lucide-react";
import { useHeroStats } from "./heroes/_shared";
import { useT } from "@/lib/tenantI18n";
import { useTenantBusinessHours } from "@/hooks/useTenantBusinessHours";

interface TenantTrustStripProps {
  tenantId: string;
  city?: string | null;
}

/**
 * Franja de confianza bajo el hero: valoración, ciudad, estado real de apertura
 * (abierto/cerrado ahora según horarios y overrides) y "reserva 24/7". Datos
 * prácticos + credibilidad de un vistazo, con el color de marca en los iconos.
 */
export function TenantTrustStrip({ tenantId, city }: TenantTrustStripProps) {
  const { rating, reviewCount } = useHeroStats(tenantId);
  const { getBusinessHoursForDay, loading: hoursLoading } = useTenantBusinessHours(tenantId);
  const t = useT();

  // Estado real de apertura: hoy, según horarios y overrides estacionales.
  const now = new Date();
  const today = getBusinessHoursForDay(now.getDay(), now);
  const minutes = now.getHours() * 60 + now.getMinutes();
  const openNow =
    !today.isClosed &&
    ((today.morningEnd > 0 && minutes >= today.morningStart && minutes < today.morningEnd) ||
      (today.afternoonEnd > 0 && minutes >= today.afternoonStart && minutes < today.afternoonEnd));

  const items: { icon: JSX.Element; label: string }[] = [];
  if (rating > 0) {
    items.push({
      icon: <Star className="h-4 w-4" style={{ color: "#e0a35f", fill: "#e0a35f" }} />,
      label: `${rating.toLocaleString("es-ES")}${reviewCount > 0 ? ` · ${reviewCount} ${t("trust.reviews")}` : ""}`,
    });
  }
  if (city) {
    items.push({ icon: <MapPin className="h-4 w-4" style={{ color: "#22408C" }} />, label: city });
  }
  if (!hoursLoading) {
    items.push({
      icon: <Clock className="h-4 w-4" style={{ color: openNow ? "#16a249" : "#98329A" }} />,
      label: openNow ? t("trust.openNow") : today.isClosed ? t("trust.closedToday") : t("trust.closedNow"),
    });
  }
  items.push({ icon: <Calendar className="h-4 w-4" style={{ color: "#98329A" }} />, label: t("trust.online") });

  return (
    <div className="relative z-10 -mt-9 md:-mt-10 bg-transparent">
      <div className="container mx-auto max-w-6xl px-4">
        <ul className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-[24px] border border-neutral-100 bg-white p-5 shadow-[0_10px_30px_-8px_rgba(16,20,40,0.14)] md:flex md:items-center md:justify-between">
          {items.map((it, i) => (
            <li key={i} className="flex min-w-0 items-center gap-2 text-[13px] font-medium text-neutral-700 font-body">
              <span className="shrink-0">{it.icon}</span>
              <span className="truncate tabular-nums">{it.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default TenantTrustStrip;
