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
      // No tenant yet - keep defaults (active, not expired) and wait
      setLoading(false);
      setIsActive(true);
      setIsExpired(false);
      return;
    }

    try {
      try {
        const { data: stripeData, error: stripeError } = await supabase.functions.invoke("check-subscription", {
          body: { tenantId },
        });

        if (!stripeError && stripeData?.has_subscription) {
          const expDate = stripeData.subscription_end || null;
          const active = stripeData.subscribed === true;
          const days = expDate
            ? Math.max(0, Math.ceil((new Date(expDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
            : null;

          setPlan(stripeData.plan_slug || "starter");
          setExpiresAt(expDate);
          setIsActive(active);
          setIsExpired(!active);
          setDaysRemaining(active ? days : 0);
          return;
        }
      } catch (stripeCheckError) {
        console.warn("Stripe subscription sync skipped, using tenant fallback:", stripeCheckError);
      }

      const { data: tenant, error } = await supabase
        .from("tenants")
        .select("subscription_plan, subscription_expires_at, is_active")
        .eq("id", tenantId)
        .single();

      if (error) throw error;

      const expDate = tenant?.subscription_expires_at;
      const isActiveFlag = tenant?.is_active !== false; // Default to true if not set
      setPlan(tenant?.subscription_plan || "starter");
      setExpiresAt(expDate);

      if (expDate) {
        const expireDate = new Date(expDate);
        const now = new Date();
        const active = expireDate > now && isActiveFlag;
        const days = Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        setIsActive(active);
        setIsExpired(!active);
        setDaysRemaining(active ? days : 0);
      } else {
        // No expiration date set - check is_active flag
        // For pilot tenants without Stripe, is_active=true means they're active
        setIsActive(isActiveFlag);
        setIsExpired(!isActiveFlag);
        setDaysRemaining(null);
      }
    } catch (error) {
      console.error("Error checking subscription status:", error);
      // On error, default to active to not block access unnecessarily
      setIsActive(true);
      setIsExpired(false);
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
