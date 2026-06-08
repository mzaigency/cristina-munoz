import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFollows } from "@/hooks/useFollows";

export interface HeroStats {
  rating: number;
  reviewCount: number;
  clients: number;
  since: number;
  followers: number;
}

export function useHeroStats(tenantId: string | undefined, opts?: { withClients?: boolean }) {
  const [stats, setStats] = useState<Omit<HeroStats, "followers">>({
    rating: 0,
    reviewCount: 0,
    clients: 0,
    since: new Date().getFullYear(),
  });

  const { useFollowerCount } = useFollows();
  const { data: followers = 0 } = useFollowerCount(tenantId ?? "");

  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;

    (async () => {
      const [{ data: reviewsData }, { data: tenantData }, clientsData] = await Promise.all([
        supabase.from("reviews").select("rating").eq("tenant_id", tenantId).eq("approved", true),
        supabase.from("tenants").select("created_at").eq("id", tenantId).single(),
        opts?.withClients
          ? supabase.from("bookings").select("customer_name").eq("tenant_id", tenantId)
          : Promise.resolve({ data: [] as { customer_name: string }[] }),
      ]);

      if (cancelled) return;

      const avgRating = reviewsData?.length
        ? Number((reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length).toFixed(1))
        : 0;

      const createdYear = tenantData?.created_at
        ? new Date(tenantData.created_at).getFullYear()
        : new Date().getFullYear();

      const clients = opts?.withClients && Array.isArray(clientsData.data)
        ? new Set(clientsData.data.map(b => b.customer_name.toLowerCase().trim())).size
        : 0;

      setStats({
        rating: avgRating,
        reviewCount: reviewsData?.length ?? 0,
        clients,
        since: createdYear,
      });
    })();

    return () => { cancelled = true; };
  }, [tenantId, opts?.withClients]);

  return { ...stats, followers };
}

export function formatFollowers(count: number): string {
  if (count >= 1_000_000) return (count / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (count >= 1_000) return (count / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(count);
}
