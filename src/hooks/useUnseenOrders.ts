import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const SEEN_KEY = (tid: string) => `product_orders_seen_${tid}`;

const getSeenIds = (tid: string): Set<string> => {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY(tid)) || "[]"));
  } catch {
    return new Set();
  }
};

export const markOrdersSeen = (tenantId: string, ids: string[]) => {
  localStorage.setItem(SEEN_KEY(tenantId), JSON.stringify(ids));
  // Notify same-tab listeners
  window.dispatchEvent(new CustomEvent("product-orders-seen", { detail: { tenantId } }));
};

/**
 * Returns count of pending orders the admin hasn't yet "seen" on this device.
 */
export const useUnseenOrders = (tenantId: string | null | undefined) => {
  const [unseenCount, setUnseenCount] = useState(0);

  useEffect(() => {
    if (!tenantId) return;

    const recompute = async () => {
      const { data } = await supabase
        .from("product_orders")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("status", "pending");
      const seen = getSeenIds(tenantId);
      const ids = (data || []).map((o: any) => o.id);
      const unseen = ids.filter((id) => !seen.has(id));
      setUnseenCount(unseen.length);
    };

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
  }, [tenantId]);

  return unseenCount;
};
