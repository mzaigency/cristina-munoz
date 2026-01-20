import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PlanFeature =
  | "stories"
  | "messages"
  | "cash_register"
  | "commissions"
  | "advanced_analytics"
  | "pdf_reports"
  | "promotions"
  | "packages"
  | "products"
  | "monthly_goals"
  | "waitlist";

interface PlanFeatures {
  stories: boolean;
  messages: boolean;
  cash_register: boolean;
  commissions: boolean;
  advanced_analytics: boolean;
  pdf_reports: boolean;
  promotions: boolean;
  packages: boolean;
  products: boolean;
  monthly_goals: boolean;
  waitlist: boolean;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  monthly_price: number;
  annual_price: number | null;
  max_stylists: number | null;
  max_services: number | null;
  features: PlanFeatures | null;
  sort_order: number | null;
}

export interface PlanLimits {
  // Límites
  maxStylists: number;
  maxServices: number;
  currentStylists: number;
  currentServices: number;

  // Features booleanos
  hasFeature: (feature: PlanFeature) => boolean;

  // Verificaciones
  canAddStylist: () => boolean;
  canAddService: () => boolean;
  isOverLimit: (type: "stylists" | "services") => boolean;

  // Info del plan
  planSlug: string;
  planName: string;

  // Loading
  loading: boolean;

  // Upgrade info
  getUpgradePlan: (feature: PlanFeature) => string | null;
  getUpgradePlanForLimit: (limitType: "stylists" | "services") => string | null;

  // Refetch
  refetch: () => Promise<void>;
}

// Mapeo de features a planes mínimos requeridos
const FEATURE_PLAN_REQUIREMENTS: Record<PlanFeature, string[]> = {
  stories: ["starter", "pro", "business"],
  messages: ["starter", "pro", "business"],
  cash_register: ["pro", "business"],
  commissions: ["business"],
  advanced_analytics: ["pro", "business"],
  pdf_reports: ["pro", "business"],
  promotions: ["pro", "business"],
  packages: ["pro", "business"],
  monthly_goals: ["business"],
  waitlist: ["business"],
};

const PLAN_ORDER = ["starter", "pro", "business"];

export const usePlanLimits = (tenantId: string | undefined): PlanLimits => {
  const [loading, setLoading] = useState(true);
  const [planSlug, setPlanSlug] = useState("starter");
  const [planName, setPlanName] = useState("Starter");
  const [maxStylists, setMaxStylists] = useState(1);
  const [maxServices, setMaxServices] = useState(15);
  const [currentStylists, setCurrentStylists] = useState(0);
  const [currentServices, setCurrentServices] = useState(0);
  const [features, setFeatures] = useState<PlanFeatures | null>(null);

  const fetchPlanData = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Obtener el plan del tenant
      const { data: tenant } = await supabase
        .from("tenants")
        .select("subscription_plan, max_stylists, max_services, features")
        .eq("id", tenantId)
        .single();

      if (!tenant) {
        setLoading(false);
        return;
      }

      const currentPlanSlug = tenant.subscription_plan || "starter";
      setPlanSlug(currentPlanSlug);

      // Obtener info del plan desde subscription_plans
      const { data: plan } = await supabase.from("subscription_plans").select("*").eq("slug", currentPlanSlug).single();

      if (plan) {
        setPlanName(plan.name);
        setMaxStylists(tenant.max_stylists || plan.max_stylists || 1);
        setMaxServices(tenant.max_services || plan.max_services || 15);

        // Parse features from plan
        if (plan.features) {
          const parsedFeatures = typeof plan.features === "string" ? JSON.parse(plan.features) : plan.features;
          setFeatures(parsedFeatures as PlanFeatures);
        }
      }

      // Contar estilistas activos
      const { count: stylistCount } = await supabase
        .from("tenant_stylists")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("is_active", true);

      setCurrentStylists(stylistCount || 0);

      // Contar servicios
      const { count: serviceCount } = await supabase
        .from("services")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId);

      setCurrentServices(serviceCount || 0);
    } catch (error) {
      console.error("Error fetching plan limits:", error);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchPlanData();
  }, [fetchPlanData]);

  const hasFeature = useCallback(
    (feature: PlanFeature): boolean => {
      if (!features) return false;
      return features[feature] === true;
    },
    [features],
  );

  const canAddStylist = useCallback((): boolean => {
    return currentStylists < maxStylists;
  }, [currentStylists, maxStylists]);

  const canAddService = useCallback((): boolean => {
    return currentServices < maxServices;
  }, [currentServices, maxServices]);

  const getUpgradePlan = useCallback(
    (feature: PlanFeature): string | null => {
      const requiredPlans = FEATURE_PLAN_REQUIREMENTS[feature];
      const currentPlanIndex = PLAN_ORDER.indexOf(planSlug);

      // Buscar el siguiente plan que tenga la feature
      for (let i = currentPlanIndex + 1; i < PLAN_ORDER.length; i++) {
        if (requiredPlans.includes(PLAN_ORDER[i])) {
          return PLAN_ORDER[i];
        }
      }
      return null;
    },
    [planSlug],
  );

  const getUpgradePlanForLimit = useCallback(
    (limitType: "stylists" | "services"): string | null => {
      const currentPlanIndex = PLAN_ORDER.indexOf(planSlug);

      if (currentPlanIndex < PLAN_ORDER.length - 1) {
        return PLAN_ORDER[currentPlanIndex + 1];
      }
      return null;
    },
    [planSlug],
  );

  const isOverLimit = useCallback(
    (type: "stylists" | "services"): boolean => {
      if (type === "stylists") return currentStylists > maxStylists;
      return currentServices > maxServices;
    },
    [currentStylists, currentServices, maxStylists, maxServices],
  );

  return {
    maxStylists,
    maxServices,
    currentStylists,
    currentServices,
    hasFeature,
    canAddStylist,
    canAddService,
    planSlug,
    planName,
    loading,
    getUpgradePlan,
    getUpgradePlanForLimit,
    isOverLimit,
    refetch: fetchPlanData,
  };
};
