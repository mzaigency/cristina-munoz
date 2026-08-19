import { Users, UserPlus, TrendingUp, UserX } from "lucide-react";
import type { Client } from "./types";

interface ClientStatsProps {
  clients: Client[];
}

/** Mismos KPIs que Caja: una sola pieza para toda cifra destacada del panel. */
export function ClientStats({ clients }: ClientStatsProps) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const newThisMonth = clients.filter((c) => new Date(c.created_at) >= startOfMonth).length;
  const avgSpent = clients.length
    ? clients.reduce((sum, c) => sum + (c.total_spent || 0), 0) / clients.length
    : 0;
  const inactive = clients.filter(
    (c) => !c.last_visit_at || new Date(c.last_visit_at) < thirtyDaysAgo,
  ).length;

  const stats = [
    { icon: Users, label: "Total", value: String(clients.length), tone: "brand" },
    { icon: UserPlus, label: "Nuevos este mes", value: String(newThisMonth), tone: "ok" },
    { icon: TrendingUp, label: "Gasto medio", value: `${avgSpent.toFixed(0)} €`, tone: "accent" },
    { icon: UserX, label: "Inactivos +30 d", value: String(inactive), tone: "warn" },
  ] as const;

  return (
    <div className="glow-kpis">
      {stats.map(({ icon: Icon, label, value, tone }) => (
        <div key={label} className="glow-kpi">
          <div className={`glow-kpi-ic glow-kpi-ic--${tone}`}>
            <Icon style={{ width: 16, height: 16 }} />
          </div>
          <div className="glow-kpi-val">{value}</div>
          <div className="glow-kpi-lbl">{label}</div>
        </div>
      ))}
    </div>
  );
}
