import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  Wallet,
  Clock,
  ShoppingCart,
  UserCircle,
  Star,
  MessageCircle,
  Scissors,
  ShoppingBag,
  Package,
  Percent,
  ImagePlus,
  QrCode,
  Users,
  BarChart3,
  Settings,
  Activity,
  Receipt,
  ClipboardList,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { NotifBadge } from "./NotifBadge";
import { usePlanLimits, type PlanFeature } from "@/hooks/usePlanLimits";

export type AdminSection =
  | "inicio"
  | "agenda"
  | "caja"
  | "clientes"
  | "catalogo"
  | "marketing"
  | "negocio"
  | "ajustes";

export type BadgeKey = "waitlist" | "orders" | "messages" | "reviews";

export interface AdminSubTabDef {
  value: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: BadgeKey;
  requiredFeature?: PlanFeature;
}

export const ADMIN_SUB_NAV: Record<AdminSection, AdminSubTabDef[]> = {
  inicio: [
    { value: "resumen", label: "Resumen", icon: LayoutDashboard },
    { value: "actividad", label: "Actividad", icon: Activity },
  ],
  agenda: [
    { value: "dia", label: "Día", icon: Calendar },
    { value: "semana", label: "Semana", icon: CalendarDays },
    { value: "espera", label: "Espera", icon: Clock, badgeKey: "waitlist" },
  ],
  caja: [
    { value: "cobros", label: "Cobros", icon: Wallet, requiredFeature: "cash_register" },
    { value: "pedidos", label: "Pedidos", icon: ShoppingCart, badgeKey: "orders" },
    { value: "cierre", label: "Cierre", icon: Receipt, requiredFeature: "cash_register" },
  ],
  clientes: [
    { value: "directorio", label: "Directorio", icon: UserCircle },
    { value: "mensajes", label: "Mensajes", icon: MessageCircle, badgeKey: "messages" },
  ],
  catalogo: [
    { value: "services", label: "Servicios", icon: Scissors },
    { value: "products", label: "Productos", icon: ShoppingBag },
    { value: "packages", label: "Paquetes", icon: Package, requiredFeature: "packages" },
  ],
  marketing: [
    { value: "posts", label: "Posts", icon: ImagePlus },
    { value: "promos", label: "Promos", icon: Percent, requiredFeature: "promotions" },
    { value: "resenas", label: "Reseñas", icon: Star, badgeKey: "reviews" },
    { value: "qr", label: "Tarjetas QR", icon: QrCode },
  ],
  negocio: [
    { value: "equipo", label: "Equipo", icon: Users },
    { value: "informes", label: "Informes", icon: BarChart3 },
  ],
  ajustes: [
    { value: "general", label: "General", icon: Settings },
    { value: "plan", label: "Plan", icon: Receipt },
    { value: "alertas", label: "Alertas", icon: Activity },
  ],
};

export const getDefaultSubTab = (section: AdminSection): string =>
  ADMIN_SUB_NAV[section][0]?.value ?? "";

interface AdminSubNavProps {
  tenantId: string;
  section: AdminSection;
  activeSubTab: string;
  counts: Partial<Record<BadgeKey, number>>;
  onSelect: (subTab: string) => void;
}

export function AdminSubNav({
  tenantId,
  section,
  activeSubTab,
  counts,
  onSelect,
}: AdminSubNavProps) {
  const { hasFeature } = usePlanLimits(tenantId);
  const items = ADMIN_SUB_NAV[section] || [];
  const current = activeSubTab || getDefaultSubTab(section);

  if (items.length <= 1) return null;

  return (
    <nav
      role="tablist"
      aria-label={`Sub-navegación ${section}`}
      className="border-b"
      style={{ background: "color-mix(in oklab, var(--gp-bg), white 30%)", backdropFilter: "blur(12px)", borderColor: "var(--gp-line)" }}
    >
      <div className="mx-auto max-w-7xl px-3 min-[920px]:px-[26px]">
        <ScrollArea className="w-full">
          <div className="flex items-center gap-1 py-2.5">
            {items.map((item) => {
              const isActive = current === item.value;
              const locked = item.requiredFeature ? !hasFeature(item.requiredFeature) : false;
              const badge = item.badgeKey ? counts[item.badgeKey] || 0 : 0;
              const Icon = locked ? Lock : item.icon;

              return (
                <button
                  key={item.value}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`${item.label}${badge > 0 ? `, ${badge} pendientes` : ""}${locked ? ", requiere plan Pro" : ""}`}
                  onClick={() => {
                    if (locked) return;
                    onSelect(item.value);
                  }}
                  className={cn("gp-subtab", isActive && "on", locked && "opacity-60 cursor-not-allowed")}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{item.label}</span>
                  {locked && (
                    <span className="text-[10px] font-semibold text-amber-600">Pro</span>
                  )}
                  {badge > 0 && !isActive && (
                    <span className="gp-subtab-count">{badge}</span>
                  )}
                </button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" className="h-1" />
        </ScrollArea>
      </div>
    </nav>
  );
}
