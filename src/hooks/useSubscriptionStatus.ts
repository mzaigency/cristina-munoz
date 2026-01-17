import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionStatus {
  isActive: boolean;
  isExpired: boolean;
  expiresAt: string | null;
  plan: string | null;
  daysRemaining: number | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useSubscriptionStatus(tenantId: string | undefined): SubscriptionStatus {
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    try {
      const { data: tenant, error } = await supabase
        .from("tenants")
        .select("subscription_plan, subscription_expires_at")
        .eq("id", tenantId)
        .single();

      if (error) throw error;

      const expDate = tenant?.subscription_expires_at;
      setPlan(tenant?.subscription_plan || "starter");
      setExpiresAt(expDate);

      if (expDate) {
        const expireDate = new Date(expDate);
        const now = new Date();
        const active = expireDate > now;
        const days = Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        setIsActive(active);
        setIsExpired(!active);
        setDaysRemaining(active ? days : 0);
      } else {
        // No expiration date set - treat as expired for safety
        setIsActive(false);
        setIsExpired(true);
        setDaysRemaining(0);
      }
    } catch (error) {
      console.error("Error checking subscription status:", error);
      // On error, default to expired for safety
      setIsActive(false);
      setIsExpired(true);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    isActive,
    isExpired,
    expiresAt,
    plan,
    daysRemaining,
    loading,
    refetch: fetchStatus
  };
}
