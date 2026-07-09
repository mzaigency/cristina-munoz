import { Star, MapPin, Clock, Calendar } from "lucide-react";
import { useHeroStats } from "./heroes/_shared";
import { useT } from "@/lib/tenantI18n";

interface TenantTrustStripProps {
  tenantId: string;
  city?: string | null;
}

/**
 * Franja de confianza bajo el hero: valoración, ciudad, "reserva 24/7" y
 * "sin llamadas". Datos prácticos + credibilidad de un vistazo. Clara,
 * con el color de marca en los iconos.
 */
export function TenantTrustStrip({ tenantId, city }: TenantTrustStripProps) {
  const { rating, reviewCount } = useHeroStats(tenantId);
  const t = useT();

  const items: { icon: JSX.Element; label: string }[] = [];
  if (rating > 0) {
    items.push({
      icon: <Star className="h-4 w-4" style={{ color: "#e0a35f", fill: "#e0a35f" }} />,
      label: `${rating.toLocaleString("es-ES")}${reviewCount > 0 ? ` · ${reviewCount} ${t("trust.reviews")}` : ""}`,
    });
  }
  if (city) {
    items.push({ icon: <MapPin className="h-4 w-4" style={{ color: "#22408c" }} />, label: city });
  }
  items.push({ icon: <Clock className="h-4 w-4" style={{ color: "#22408c" }} />, label: t("trust.openToday") });
  items.push({ icon: <Calendar className="h-4 w-4" style={{ color: "#98329a" }} />, label: t("trust.online") });

  return (
    <div className="border-b border-neutral-200/70 bg-white">
      <div className="container mx-auto max-w-6xl px-4">
        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 py-3.5 md:justify-between">
          {items.map((it, i) => (
            <li key={i} className="flex items-center gap-2 text-[13px] font-medium text-neutral-700 font-body">
              {it.icon}
              <span className="tabular-nums">{it.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default TenantTrustStrip;
