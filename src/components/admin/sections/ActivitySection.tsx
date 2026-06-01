import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar,
  Star,
  MessageCircle,
  ShoppingCart,
  UserPlus,
  Activity as ActivityIcon,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type ActivityType = "booking" | "review" | "message" | "order" | "client";

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  subtitle: string;
  createdAt: string;
  actionPath: string;
}

interface ActivitySectionProps {
  tenantId: string;
  tenantSlug: string;
  onNavigate: (path: string) => void;
}

const FILTERS: { value: ActivityType | "all"; label: string }[] = [
  { value: "all", label: "Todo" },
  { value: "booking", label: "Reservas" },
  { value: "review", label: "Reseñas" },
  { value: "message", label: "Mensajes" },
  { value: "order", label: "Pedidos" },
  { value: "client", label: "Clientes" },
];

const TYPE_META: Record<
  ActivityType,
  { icon: typeof Calendar; bg: string; fg: string; ring: string }
> = {
  booking: {
    icon: Calendar,
    bg: "bg-primary/10",
    fg: "text-primary",
    ring: "ring-primary/20",
  },
  review: {
    icon: Star,
    bg: "bg-amber-500/10",
    fg: "text-amber-600",
    ring: "ring-amber-500/20",
  },
  message: {
    icon: MessageCircle,
    bg: "bg-blue-500/10",
    fg: "text-blue-600",
    ring: "ring-blue-500/20",
  },
  order: {
    icon: ShoppingCart,
    bg: "bg-emerald-500/10",
    fg: "text-emerald-600",
    ring: "ring-emerald-500/20",
  },
  client: {
    icon: UserPlus,
    bg: "bg-purple-500/10",
    fg: "text-purple-600",
    ring: "ring-purple-500/20",
  },
};

const formatDate = (d: string) => {
  try {
    return formatDistanceToNow(new Date(d), { addSuffix: true, locale: es });
  } catch {
    return "";
  }
};

const ActivitySection = ({ tenantId, tenantSlug, onNavigate }: ActivitySectionProps) => {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ActivityType | "all">("all");

  const fetchActivity = useCallback(async () => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [bookingsR, reviewsR, ordersR, clientsR, conversationsR] = await Promise.all([
        supabase
          .from("bookings")
          .select("id, customer_name, services, Fecha, Hora, created_at, status")
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("reviews")
          .select("id, rating, comment, created_at, user_id")
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("product_orders")
          .select("id, customer_name, total, created_at, status")
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("clients")
          .select("id, name, created_at")
          .eq("tenant_id", tenantId)
          .gte("created_at", sevenDaysAgo)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("conversations")
          .select("id, user_id, last_message_at, unread_count_salon")
          .eq("tenant_id", tenantId)
          .order("last_message_at", { ascending: false })
          .limit(10),
      ]);

      // Resolve reviewer names for reviews + conversation users (best effort).
      const userIds = new Set<string>();
      (reviewsR.data || []).forEach((r) => r.user_id && userIds.add(r.user_id));
      (conversationsR.data || []).forEach((c) => c.user_id && userIds.add(c.user_id));
      const profilesMap = new Map<string, string>();
      if (userIds.size > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", [...userIds]);
        (profs || []).forEach((p) => profilesMap.set(p.id, p.full_name || "Cliente"));
      }

      const merged: ActivityItem[] = [];

      (bookingsR.data || []).forEach((b) => {
        const services = Array.isArray(b.services)
          ? (b.services as Array<{ name?: string }>).map((s) => s?.name).filter(Boolean).join(", ")
          : "";
        merged.push({
          id: `b-${b.id}`,
          type: "booking",
          title:
            b.status === "cancelled"
              ? `Reserva cancelada · ${b.customer_name}`
              : `Nueva reserva · ${b.customer_name}`,
          subtitle: `${services || "Servicio"} · ${b.Fecha} ${String(b.Hora).slice(0, 5)}`,
          createdAt: b.created_at as string,
          actionPath: `/admin/${tenantSlug}/inicio/agenda`,
        });
      });

      (reviewsR.data || []).forEach((r) => {
        merged.push({
          id: `r-${r.id}`,
          type: "review",
          title: `${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)} · ${profilesMap.get(r.user_id) || "Cliente"}`,
          subtitle: r.comment?.slice(0, 80) || "Nueva valoración",
          createdAt: r.created_at as string,
          actionPath: `/admin/${tenantSlug}/clientes/resenas`,
        });
      });

      (ordersR.data || []).forEach((o) => {
        merged.push({
          id: `o-${o.id}`,
          type: "order",
          title: `Pedido · ${o.customer_name}`,
          subtitle: `${Number(o.total).toFixed(2)} € · ${o.status}`,
          createdAt: o.created_at as string,
          actionPath: `/admin/${tenantSlug}/inicio/pedidos`,
        });
      });

      (clientsR.data || []).forEach((c) => {
        merged.push({
          id: `c-${c.id}`,
          type: "client",
          title: `Cliente nuevo · ${c.name}`,
          subtitle: "Se ha registrado en tu salón",
          createdAt: c.created_at as string,
          actionPath: `/admin/${tenantSlug}/clientes/directorio`,
        });
      });

      (conversationsR.data || [])
        .filter((c) => c.unread_count_salon > 0)
        .forEach((c) => {
          merged.push({
            id: `m-${c.id}`,
            type: "message",
            title: `Mensaje de ${profilesMap.get(c.user_id) || "Cliente"}`,
            subtitle: `${c.unread_count_salon} sin leer`,
            createdAt: c.last_message_at as string,
            actionPath: `/admin/${tenantSlug}/clientes/mensajes`,
          });
        });

      merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setItems(merged.slice(0, 50));
    } catch (err) {
      console.error("Error loading activity:", err);
    } finally {
      setLoading(false);
    }
  }, [tenantId, tenantSlug]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  // Realtime: refetch on any change for this tenant
  useEffect(() => {
    if (!tenantId) return;
    const channel = supabase
      .channel(`activity-${tenantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `tenant_id=eq.${tenantId}` },
        () => fetchActivity(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reviews", filter: `tenant_id=eq.${tenantId}` },
        () => fetchActivity(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_orders", filter: `tenant_id=eq.${tenantId}` },
        () => fetchActivity(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "clients", filter: `tenant_id=eq.${tenantId}` },
        () => fetchActivity(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations", filter: `tenant_id=eq.${tenantId}` },
        () => fetchActivity(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, fetchActivity]);

  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.type === filter)),
    [items, filter],
  );

  return (
    <div className="px-3 pt-3 pb-[88px] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="p-2 rounded-xl bg-primary/10">
          <ActivityIcon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-semibold leading-tight">Actividad reciente</h2>
          <p className="text-xs text-muted-foreground">Lo último que ha pasado en tu salón</p>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-3 scrollbar-none">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border",
              filter === f.value
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background/60 backdrop-blur-md border-border/60 text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="p-4 rounded-full bg-muted/50 mb-4">
            <ActivityIcon className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <h3 className="font-medium text-foreground mb-1">Sin actividad reciente</h3>
          <p className="text-sm text-muted-foreground max-w-[220px]">
            Cuando lleguen reservas, mensajes o reseñas, las verás aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-2 mt-2">
          <AnimatePresence initial={false} mode="popLayout">
            {visible.map((item) => {
              const meta = TYPE_META[item.type];
              const Icon = meta.icon;
              return (
                <motion.button
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => onNavigate(item.actionPath)}
                  className="w-full text-left flex items-start gap-3 p-3 rounded-2xl bg-background/70 backdrop-blur-xl border border-border/60 shadow-sm hover:shadow-md hover:border-border transition-all active:scale-[0.99]"
                >
                  <div
                    className={cn(
                      "shrink-0 h-10 w-10 rounded-xl flex items-center justify-center ring-1",
                      meta.bg,
                      meta.ring,
                    )}
                  >
                    <Icon className={cn("h-4.5 w-4.5", meta.fg)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {item.subtitle}
                    </p>
                    <p className="text-[11px] text-muted-foreground/70 mt-1">
                      {formatDate(item.createdAt)}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default ActivitySection;
