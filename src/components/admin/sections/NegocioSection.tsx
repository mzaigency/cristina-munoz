import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Clock,
  BarChart3,
  Target,
  Lock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { NegocioOverview } from "../negocio/NegocioOverview";
import { TeamHub } from "../negocio/TeamHub";
import { HoursManager } from "../negocio/HoursManager";
import { GoalsReports } from "../negocio/GoalsReports";
import { BusinessStats } from "../BusinessStats";
import { LockedFeature } from "../LockedFeature";
import { usePlanLimits, type PlanFeature } from "@/hooks/usePlanLimits";

interface NegocioSectionProps {
  tenantId: string;
  tenantSlug: string;
  subTab?: string;
  onSubTabChange?: (subTab: string) => void;
}

type NegocioTab = "resumen" | "equipo" | "horarios" | "estadisticas" | "objetivos";

const NegocioSection = ({ tenantId, subTab, onSubTabChange }: NegocioSectionProps) => {
  const validTabs: NegocioTab[] = ["resumen", "equipo", "horarios", "estadisticas", "objetivos"];
  const [internalTab, setInternalTab] = useState<NegocioTab>("resumen");
  const activeTab: NegocioTab = validTabs.includes(subTab as NegocioTab)
    ? (subTab as NegocioTab)
    : internalTab;

  const setActiveTab = (t: NegocioTab) => {
    if (onSubTabChange) onSubTabChange(t);
    else setInternalTab(t);
  };

  const [tenantName, setTenantName] = useState<string>("Salón");
  const { hasFeature, planSlug } = usePlanLimits(tenantId);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("tenants")
      .select("name")
      .eq("id", tenantId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data?.name) setTenantName(data.name);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  /** Qué pestaña exige plan. AdminSubNav ya las bloquea en la fila; esto
      cubre la navegación que llega desde el Resumen. */
  const LOCKED: Partial<Record<NegocioTab, PlanFeature>> = {
    estadisticas: "advanced_analytics",
    objetivos: "monthly_goals",
  };

  const handleTabChange = (id: NegocioTab) => {
    const needs = LOCKED[id];
    if (needs && !hasFeature(needs)) return;
    setActiveTab(id);
  };

  return (
    <div className="glow-mkt">
      <div className="glow-mkt-body">
        {activeTab === "resumen" && (
          <NegocioOverview tenantId={tenantId} onNavigate={(t) => handleTabChange(t as NegocioTab)} />
        )}
        {activeTab === "equipo" && (
          <div data-tour-target="negocio-equipo">
            <TeamHub tenantId={tenantId} />
          </div>
        )}
        {activeTab === "horarios" && <HoursManager tenantId={tenantId} />}
        {activeTab === "estadisticas" &&
          (!hasFeature("advanced_analytics") ? (
            <LockedFeature
              featureName="Estadísticas"
              currentPlan={planSlug}
              requiredPlan="pro"
              tenantId={tenantId}
              variant="inline"
            />
          ) : (
            <BusinessStats tenantId={tenantId} />
          ))}
        {activeTab === "objetivos" &&
          (!hasFeature("monthly_goals") ? (
            <LockedFeature
              featureName="Objetivos"
              currentPlan={planSlug}
              requiredPlan="business"
              tenantId={tenantId}
              variant="inline"
            />
          ) : (
            <GoalsReports tenantId={tenantId} tenantName={tenantName} />
          ))}
      </div>
    </div>
  );
};

export default NegocioSection;
