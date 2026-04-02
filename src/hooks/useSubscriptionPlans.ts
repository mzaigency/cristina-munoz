import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SubscriptionPlanData {
  id: string;
  name: string;
  slug: string;
  monthly_price: number;
  annual_price: number | null;
  max_stylists: number | null;
  max_services: number | null;
  features: Record<string, boolean> | null;
  sort_order: number | null;
  is_active: boolean | null;
}

export function useSubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlanData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data, error } = await supabase
          .from("subscription_plans")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

        if (error) throw error;

        setPlans(
          (data || []).map((p) => ({
            ...p,
            features:
              typeof p.features === "object" && p.features !== null && !Array.isArray(p.features)
                ? (p.features as Record<string, boolean>)
                : null,
          }))
        );
      } catch (err) {
        console.error("Error fetching subscription plans:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const getPlan = (slug: string): SubscriptionPlanData | undefined =>
    plans.find((p) => p.slug === slug);

  return { plans, loading, getPlan };
}
