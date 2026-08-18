import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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

const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  pending: { label: "Nuevo", tone: "warn"}, ready: { label:"Reservado", tone: "info"}, delivered: { label:"Entregado", tone: "ok"}, cancelled: { label:"Cancelado", tone: "neutral"},
}; import { markOrdersSeen } from"@/hooks/useUnseenOrders";

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
    const list = (data || []) as unknown as ProductOrder[];
    setOrders(list);
    setLoading(false);
    // Marcar todos los pendientes como vistos al abrir el panel
    const pendingIds = list.filter((o) => o.status === "pending").map((o) => o.id);
    markOrdersSeen(tenantId, pendingIds);
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
      toast({ title: "Error", description: error.message, variant: "destructive"}); } else { toast({ title:"Estado actualizado"}); } }; const filtered = orders.filter((o) => { if (filter ==="active") return o.status === "pending"|| o.status ==="ready";
    if (filter === "all") return true;
    return o.status === filter;
  });

  const pendingCount = orders.filter((o) => o.status === "pending").length;

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
        <Loader2 className="gp-spinner" />
      </div>
    );
  }

  return (
    <div className="gp-fade"style={{ display:"flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div className="gp-page-h">
        <div>
          <h2>Pedidos de tienda</h2>
          <p>
            Pedidos de productos en tiempo real
            {pendingCount > 0 && <> · <span style={{ color: "var(--gp-warn)", fontWeight: 800 }}>{pendingCount} nuevos</span></>}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="gp-subtabs">
        {[
          { id: "active", label: "Activos"}, { id:"delivered", label: "Entregados"}, { id:"cancelled", label: "Cancelados"}, { id:"all", label: "Todos"}, ].map((t) => ( <button key={t.id} className={`gp-subtab${filter === t.id ?" on":""}`} onClick={() => setFilter(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="gp-card">
          <div className="gp-empty">
            <div className="gp-empty-ic"><ShoppingBag style={{ width: 24, height: 24 }} /></div>
            <h4>Sin pedidos</h4>
            <p>No hay pedidos en esta categoría</p>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((o) => {
            const statusInfo = STATUS_LABELS[o.status] || STATUS_LABELS.pending;
            return (
              <div key={o.id} className="gp-card pad"style={{ display:"flex", flexDirection: "column", gap: 14 }}>
                {/* Top row */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: "var(--gp-ink)", display: "flex", alignItems: "center", gap: 6 }}>
                        <User style={{ width: 14, height: 14, color: "var(--gp-muted-c)" }} />
                        {o.customer_name}
                      </span>
                      <span className={`gp-badge ${statusInfo.tone}`}><span className="pip"style={{ background:"currentColor" }} />{statusInfo.label}</span>
                      {o.booking_id && <span className="gp-badge neutral"><Calendar style={{ width: 10, height: 10 }} />Con cita</span>}
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--gp-muted-c)", fontWeight: 600 }}>
                      {format(new Date(o.created_at), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                    </div>
                    {o.customer_phone && (
                      <a href={`tel:${o.customer_phone}`} style={{ fontSize: 12.5, color: "var(--gp-accent)", fontWeight: 600, display: "flex", alignItems: "center", gap: 5, marginTop: 4, textDecoration: "none" }}>
                        <Phone style={{ width: 12, height: 12 }} /> {o.customer_phone}
                      </a>
                    )}
                  </div>
                  <span className="gp-mono"style={{ fontSize: 20, fontWeight: 800, color:"var(--gp-accent)", flex: "none"}}> {o.total.toFixed(2)} € </span> </div> {/* Items */} <div style={{ paddingLeft: 12, borderLeft: `2px solid var(--gp-accent-soft)`, display:"flex", flexDirection: "column", gap: 6 }}>
                  {o.items?.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13.5, fontWeight: 600 }}>
                      <span style={{ color: "var(--gp-ink2)", display: "flex", alignItems: "center", gap: 6 }}>
                        <PackageIcon style={{ width: 13, height: 13, color: "var(--gp-muted-c)" }} />
                        {item.quantity}× {item.name}
                      </span>
                      <span className="gp-mono"style={{ color:"var(--gp-muted-c)", fontSize: 13 }}>
                        {(item.quantity * item.price).toFixed(2)} €
                      </span>
                    </div>
                  ))}
                </div>

                {o.notes && (
                  <div style={{ fontSize: 13, background: "var(--gp-chip)", borderRadius: 10, padding: "10px 14px", color: "var(--gp-ink2)"}}> <span style={{ fontWeight: 700 }}>Notas:</span> {o.notes} </div> )} {o.status !=="delivered"&& o.status !=="cancelled"&& ( <div style={{ display:"flex", gap: 8, paddingTop: 4, borderTop: "1px solid var(--gp-line2)"}}> {o.status ==="pending" && (
                      <button className="gp-btn primary sm"style={{ flex: 1 }} onClick={() => updateStatus(o.id,"ready")}>
                        <Check style={{ width: 14, height: 14 }} /> Reservar pedido
                      </button>
                    )}
                    {o.status === "ready" && (
                      <button className="gp-btn sm"style={{ flex: 1, background:"var(--gp-ok)", color: "#fff", borderColor: "transparent"}} onClick={() => updateStatus(o.id,"delivered")}>
                        <PackageIcon style={{ width: 14, height: 14 }} /> Marcar entregado
                      </button>
                    )}
                    <button className="gp-btn sm danger"onClick={() => updateStatus(o.id,"cancelled")}>
                      <X style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductOrdersManager;
