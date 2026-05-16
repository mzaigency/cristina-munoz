import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Calendar,
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
  Lock,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { NotifBadge } from "./NotifBadge";
import { usePlanLimits, type PlanFeature } from "@/hooks/usePlanLimits";

export type AdminSection = "inicio" | "clientes" | "catalogo" | "marketing" | "negocio";
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
    { value: "agenda", label: "Agenda", icon: Calendar },
    { value: "caja", label: "Caja", icon: Wallet, requiredFeature: "cash_register" },
    { value: "espera", label: "Espera", icon: Clock, badgeKey: "waitlist" },
    { value: "pedidos", label: "Pedidos", icon: ShoppingCart, badgeKey: "orders" },
  ],
  clientes: [
    { value: "directorio", label: "Directorio", icon: UserCircle },
    { value: "mensajes", label: "Mensajes", icon: MessageCircle, badgeKey: "messages" },
    { value: "resenas", label: "Reseñas", icon: Star, badgeKey: "reviews" },
  ],
  catalogo: [
    { value: "services", label: "Servicios", icon: Scissors },
    { value: "products", label: "Productos", icon: ShoppingBag },
    { value: "packages", label: "Paquetes", icon: Package, requiredFeature: "packages" },
    { value: "promos", label: "Promos", icon: Percent, requiredFeature: "promotions" },
  ],
  marketing: [
    { value: "posts", label: "Posts", icon: ImagePlus },
    { value: "qr", label: "Tarjetas QR", icon: QrCode },
  ],
  negocio: [
    { value: "equipo", label: "Equipo", icon: Users },
    { value: "informes", label: "Informes", icon: BarChart3 },
    { value: "ajustes", label: "Ajustes", icon: Settings },
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
      className="border-b border-border/40 bg-background/60 backdrop-blur-xl"
    >
      <div className="mx-auto max-w-7xl px-2 sm:px-4">
        <ScrollArea className="w-full">
          <div className="flex items-center gap-1 py-1.5">
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
                  className={cn(
                    "relative flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-lg",
                    "text-xs sm:text-sm font-medium transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                    locked && "opacity-60 cursor-not-allowed",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                  {locked && (
                    <span className="text-[10px] font-semibold text-amber-600 ml-0.5">Pro</span>
                  )}
                  {badge > 0 && !isActive && (
                    <NotifBadge count={badge} position="inline" className="ml-0.5 h-4 min-w-[16px] text-[10px] ring-0 shadow-none" />
                  )}
                  {isActive && (
                    <motion.span
                      layoutId="admin-subnav-underline"
                      className="absolute left-2 right-2 -bottom-[7px] h-[2px] rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
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
