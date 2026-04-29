import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, Phone, User, Calendar, Loader2, Check, Package as PackageIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
}

interface ProductOrder {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  items: OrderItem[];
  total: number;
  status: string;
  pickup_type: string;
  notes: string | null;
  booking_id: string | null;
  created_at: string;
}

interface Props {
  tenantId: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-amber-500/15 text-amber-700 border-amber-300" },
  ready: { label: "Listo", color: "bg-blue-500/15 text-blue-700 border-blue-300" },
  delivered: { label: "Entregado", color: "bg-green-500/15 text-green-700 border-green-300" },
  cancelled: { label: "Cancelado", color: "bg-red-500/15 text-red-700 border-red-300" },
};

export const ProductOrdersManager = ({ tenantId }: Props) => {
  const [orders, setOrders] = useState<ProductOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("active");
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase
      .from("product_orders")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    setOrders((data || []) as unknown as ProductOrder[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`product_orders_${tenantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_orders", filter: `tenant_id=eq.${tenantId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            toast({
              title: "🛍️ Nuevo pedido de tienda",
              description: `${(payload.new as any).customer_name} · ${(payload.new as any).total.toFixed(2)} €`,
            });
          }
          load();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("product_orders").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Estado actualizado" });
    }
  };

  const filtered = orders.filter((o) => {
    if (filter === "active") return o.status === "pending" || o.status === "ready";
    if (filter === "all") return true;
    return o.status === filter;
  });

  const pendingCount = orders.filter((o) => o.status === "pending").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Pedidos de tienda
            {pendingCount > 0 && (
              <Badge className="bg-amber-500 text-white">{pendingCount} nuevos</Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">Pedidos de productos en tiempo real</p>
        </div>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="w-full">
          <TabsTrigger value="active" className="flex-1">Activos</TabsTrigger>
          <TabsTrigger value="delivered" className="flex-1">Entregados</TabsTrigger>
          <TabsTrigger value="cancelled" className="flex-1">Cancelados</TabsTrigger>
          <TabsTrigger value="all" className="flex-1">Todos</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No hay pedidos en esta categoría</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => {
            const statusInfo = STATUS_LABELS[o.status] || STATUS_LABELS.pending;
            return (
              <Card key={o.id} className="overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold flex items-center gap-1.5">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {o.customer_name}
                        </h3>
                        <Badge variant="outline" className={statusInfo.color}>
                          {statusInfo.label}
                        </Badge>
                        {o.booking_id && (
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            Con cita
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(o.created_at), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                      </p>
                      {o.customer_phone && (
                        <a
                          href={`tel:${o.customer_phone}`}
                          className="text-xs text-primary flex items-center gap-1 mt-1 hover:underline"
                        >
                          <Phone className="h-3 w-3" /> {o.customer_phone}
                        </a>
                      )}
                    </div>
                    <span className="text-xl font-bold text-primary shrink-0">
                      {o.total.toFixed(2)} €
                    </span>
                  </div>

                  <div className="space-y-1 pl-2 border-l-2 border-primary/30">
                    {o.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span>
                          <PackageIcon className="h-3.5 w-3.5 inline mr-1.5 text-muted-foreground" />
                          {item.quantity}× {item.name}
                        </span>
                        <span className="text-muted-foreground tabular-nums">
                          {(item.quantity * item.price).toFixed(2)} €
                        </span>
                      </div>
                    ))}
                  </div>

                  {o.notes && (
                    <div className="text-xs bg-muted/50 rounded-md p-2 border">
                      <span className="font-medium">Notas:</span> {o.notes}
                    </div>
                  )}

                  {o.status !== "delivered" && o.status !== "cancelled" && (
                    <div className="flex gap-2 pt-1">
                      {o.status === "pending" && (
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => updateStatus(o.id, "ready")}>
                          <PackageIcon className="h-4 w-4 mr-1" /> Marcar listo
                        </Button>
                      )}
                      <Button size="sm" className="flex-1" onClick={() => updateStatus(o.id, "delivered")}>
                        <Check className="h-4 w-4 mr-1" /> Entregado
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={() => updateStatus(o.id, "cancelled")}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductOrdersManager;
