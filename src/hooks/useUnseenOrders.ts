import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const SEEN_KEY = "product_orders";

/**
 * Cuenta pedidos pending creados después de la última vez que el admin
 * marcó como "vistos" (persistido en admin_seen_state por user+tenant).
 */
export const useUnseenOrders = (tenantId: string | null | undefined) => {
  const [unseenCount, setUnseenCount] = useState(0);

  const recompute = useCallback(async () => {
    if (!tenantId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: seenRow } = await supabase
      .from("admin_seen_state")
      .select("last_seen_at")
      .eq("user_id", user.id)
      .eq("tenant_id", tenantId)
      .eq("key", SEEN_KEY)
      .maybeSingle();

    const since = seenRow?.last_seen_at || "1970-01-01";
    const { count } = await supabase
      .from("product_orders")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "pending")
      .gt("created_at", since);

    setUnseenCount(count || 0);
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId) return;
    recompute();

    const ch = supabase
      .channel(`unseen_orders_${tenantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_orders", filter: `tenant_id=eq.${tenantId}` },
        () => recompute()
      )
      .subscribe();

    const handleSeen = (e: any) => {
      if (e?.detail?.tenantId === tenantId) recompute();
    };
    window.addEventListener("product-orders-seen", handleSeen);

    return () => {
      supabase.removeChannel(ch);
      window.removeEventListener("product-orders-seen", handleSeen);
    };
  }, [tenantId, recompute]);

  return unseenCount;
};

export const markOrdersSeen = async (tenantId: string, _ids?: string[]) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("admin_seen_state").upsert(
    { user_id: user.id, tenant_id: tenantId, key: SEEN_KEY, last_seen_at: new Date().toISOString() },
    { onConflict: "user_id,tenant_id,key" }
  );
  window.dispatchEvent(new CustomEvent("product-orders-seen", { detail: { tenantId } }));
};
