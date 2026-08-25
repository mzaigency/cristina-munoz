import { forwardRef } from "react";
import { ChevronRight, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";
import { chartColor, readableInk } from "@/lib/chartColors";
import type { Client } from "./types";
import { TAG_COLORS } from "./types";

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
        <div
          className="glow-avatar"
          style={{ background: avatarColor(client.name), color: readableInk(avatarColor(client.name)) }}
        >
          {getInitials(client.name)}
        </div>
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
        <div className="glow-row-mt">
          {client.total_visits} {client.total_visits === 1 ? "visita" : "visitas"}
          {client.phone && ` · ${client.phone}`}
          {client.last_visit_at &&
            ` · últ. ${format(new Date(client.last_visit_at), "d MMM", { locale: es })}`}
        </div>
      </div>

      <div className="glow-row-amt">{(client.total_spent || 0).toFixed(0)} €</div>
      <ChevronRight style={{ width: 17, height: 17, color: "var(--glow-ink-3)", flex: "none" }} />
    </motion.div>
  );
});
