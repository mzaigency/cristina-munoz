import {
  History,
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
  Target,
  Megaphone,
  Palmtree,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { NotifBadge } from "./NotifBadge";
import { usePlanLimits, type PlanFeature } from "@/hooks/usePlanLimits";

export type AdminSection =
  | "inicio"
  | "agenda"
  | "caja"
  | "equipo"
  | "clientes"
  | "catalogo"
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
    { value: "cobros", label: "Cobrar", icon: Wallet, requiredFeature: "cash_register" },
    { value: "historial", label: "Historial", icon: History, requiredFeature: "cash_register" },
    { value: "pedidos", label: "Pedidos", icon: ShoppingCart, badgeKey: "orders" },
    { value: "cierre", label: "Cierre", icon: Receipt, requiredFeature: "cash_register" },
  ],
  equipo: [
    { value: "personal", label: "Miembros", icon: Users },
    { value: "horarios", label: "Horarios y Turnos", icon: Clock },
    { value: "ausencias", label: "Vacaciones y Ausencias", icon: Palmtree },
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
  negocio: [
    { value: "estadisticas", label: "Estadísticas", icon: BarChart3, requiredFeature: "advanced_analytics" },
    { value: "objetivos", label: "Objetivos", icon: Target, requiredFeature: "monthly_goals" },
    { value: "posts", label: "Posts Feed", icon: ImagePlus },
    { value: "qr", label: "Tarjetas QR", icon: QrCode },
  ],
  ajustes: [
    { value: "general", label: "General", icon: Settings },
    { value: "plan", label: "Plan", icon: Receipt },
    { value: "alertas", label: "Alertas", icon: Activity },
  ],
};

import { motion, LayoutGroup } from "framer-motion";

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
  const navRef = useRef<HTMLElement>(null);

  // La fila hace scroll horizontal: al entrar por enlace directo (p. ej.
  // negocio/estadisticas) la pill activa puede quedar fuera de vista.
  useEffect(() => {
    const active = navRef.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    active?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [section, current]);

  if (items.length <= 1) return null;

  return (
    <nav
      ref={navRef}
      role="tablist"
      aria-label={`Sub-navegación ${section}`}
      className="glow-subnav"
    >
      <div className="mx-auto max-w-7xl px-3 min-[920px]:px-[26px]">
        <ScrollArea className="w-full">
          <LayoutGroup id={`admin-subnav-dock-${section}`}>
            <div className="glow-subnav-row relative">
              {items.map((item) => {
                const isActive = current === item.value;
                const locked = item.requiredFeature ? !hasFeature(item.requiredFeature) : false;
                const badge = item.badgeKey ? counts[item.badgeKey] || 0 : 0;
                const hasNotif = badge > 0;
                const Icon = locked ? Lock : item.icon;

                return (
                  <motion.button
                    whileTap={!locked ? { scale: 0.97 } : undefined}
                    key={item.value}
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`${item.label}${badge > 0 ? `, ${badge} pendientes` : ""}${locked ? ", requiere plan Pro" : ""}`}
                    onClick={() => {
                      if (locked) return;
                      onSelect(item.value);
                    }}
                    className={cn(
                      "glow-subtab relative z-10",
                      isActive && "glow-subtab--on",
                      hasNotif && !isActive && "glow-subtab--has-notif",
                      locked && "glow-subtab--locked",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{item.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </LayoutGroup>
          <ScrollBar orientation="horizontal" className="h-1" />
        </ScrollArea>
      </div>
    </nav>
  );
}
