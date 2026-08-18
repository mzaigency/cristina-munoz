import { Users, UserPlus, TrendingUp, UserX } from "lucide-react";
import type { Client } from "./types";

interface ClientStatsProps {
  clients: Client[];
}

export function ClientStats({ clients }: ClientStatsProps) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const newThisMonth = clients.filter(c => new Date(c.created_at) >= startOfMonth).length;
  const avgSpent = clients.length > 0
    ? clients.reduce((sum, c) => sum + (c.total_spent || 0), 0) / clients.length
    : 0;
  const inactive = clients.filter(c =>
    !c.last_visit_at || new Date(c.last_visit_at) < thirtyDaysAgo
  ).length;

  const stats = [
    { icon: Users, label: "Total", value: clients.length, color: "text-primary"}, { icon: UserPlus, label:"Nuevos", value: newThisMonth, color: "text-[var(--gp-ok-ink)]"}, { icon: TrendingUp, label:"Gasto medio", value: `${avgSpent.toFixed(0)}€`, color: "text-[var(--gp-info-ink)]"}, { icon: UserX, label:"Inactivos", value: inactive, color: "text-[var(--gp-warn)]" },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {stats.map(({ icon: Icon, label, value, color }) => (
        <div key={label} className="text-center p-2.5 rounded-xl bg-muted/50 border">
          <Icon className={`h-4 w-4 mx-auto mb-1 ${color}`} />
          <p className="text-lg font-bold leading-none">{value}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}
