import { forwardRef } from "react";
import { CalendarCheck, ChevronRight, MessageCircle, UserCheck } from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";
import { chartColor, readableInk } from "@/lib/chartColors";
import type { Client } from "./types";
import { TAG_COLORS } from "./types";

/** "hoy", "ayer", "hace 5 d" o la fecha corta: se lee de un vistazo. */
function relDate(iso: string) {
  const days = differenceInCalendarDays(new Date(), new Date(iso));
  if (days <= 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 30) return `hace ${days} d`;
  return format(new Date(iso), "d MMM", { locale: es });
}


interface ClientCardProps {
  client: Client;
  index: number;
  onClick: () => void;
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

/** Color estable por nombre, tomado de la paleta de marca. */
function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return chartColor(Math.abs(hash));
}

/**
 * Una fila de la matriz de clientes, no una tarjeta suelta: el listado entero
 * vive dentro de un único `glow-card`, igual que Servicios o Productos.
 */
export const ClientCard = forwardRef<HTMLDivElement, ClientCardProps>(function ClientCard(
  { client, index, onClick },
  ref,
) {
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: Math.min(index, 12) * 0.02 }}
      className="glow-row glow-row--click"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div style={{ position: "relative", flex: "none" }}>
        {client.avatar_url ? (
          <img
            src={client.avatar_url}
            alt={client.name}
            loading="lazy"
            className="glow-avatar"
            style={{ objectFit: "cover", padding: 0 }}
          />
        ) : (
          <div
            className="glow-avatar"
            style={{ background: avatarColor(client.name), color: readableInk(avatarColor(client.name)) }}
          >
            {getInitials(client.name)}
          </div>
        )}
        {client.user_id && (
          <span
            title="Tiene cuenta en Glowapp"
            style={{
              position: "absolute", bottom: -2, right: -2, width: 15, height: 15,
              borderRadius: 999, background: "var(--glow-ok)", border: "2px solid var(--glow-surface)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <UserCheck style={{ width: 8, height: 8, color: "#fff" }} />
          </span>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="glow-row-nm" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {client.name}
          </span>
          {client.tags?.slice(0, 2).map((tag) => (
            <span key={tag} className={`glow-badge ${TAG_COLORS[tag] || ""}`} style={{ flex: "none" }}>
              {tag}
            </span>
          ))}
        </div>
        <div className="glow-row-mt" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
            <CalendarCheck style={{ width: 12, height: 12, color: "var(--glow-ink-3)" }} />
            {client.last_visit_at
              ? `Visita ${relDate(client.last_visit_at)}`
              : "Sin visitas"}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
            <MessageCircle style={{ width: 12, height: 12, color: "var(--glow-ink-3)" }} />
            {client.last_contact_at
              ? `Contacto ${relDate(client.last_contact_at)}`
              : "Sin contacto"}
          </span>
          <span>
            {client.total_visits} {client.total_visits === 1 ? "visita" : "visitas"}
          </span>
        </div>
      </div>


      <div className="glow-row-amt">{(client.total_spent || 0).toFixed(0)} €</div>
      <ChevronRight style={{ width: 17, height: 17, color: "var(--glow-ink-3)", flex: "none" }} />
    </motion.div>
  );
});
