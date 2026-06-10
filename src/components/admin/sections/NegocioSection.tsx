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

interface TabConfig {
  id: NegocioTab;
  label: string;
  icon: React.ElementType;
  requiredFeature?: PlanFeature;
  requiredPlan?: string;
}

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

  const tabs: TabConfig[] = [
    { id: "resumen", label: "Resumen", icon: LayoutDashboard },
    { id: "equipo", label: "Equipo", icon: Users },
    { id: "horarios", label: "Horarios", icon: Clock },
    { id: "estadisticas", label: "Estadísticas", icon: BarChart3, requiredFeature: "advanced_analytics", requiredPlan: "pro" },
    { id: "objetivos", label: "Objetivos & Reportes", icon: Target, requiredFeature: "monthly_goals", requiredPlan: "business" },
  ];

  const isTabLocked = (tab: TabConfig): boolean => {
    if (!tab.requiredFeature) return false;
    return !hasFeature(tab.requiredFeature);
  };

  const handleTabChange = (id: NegocioTab) => {
    const tab = tabs.find((t) => t.id === id);
    if (tab && !isTabLocked(tab)) setActiveTab(id);
  };

  return (
    <div className="gp-mkt">
      <div className="gp-mkt-tabs">
        {tabs.map((tab) => {
          const locked = isTabLocked(tab);
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`gp-mkt-tab${activeTab === tab.id ? " on" : ""}${locked ? " locked" : ""}`}
              onClick={() => handleTabChange(tab.id)}
              type="button"
            >
              {locked ? <Lock /> : <Icon />}
              <span>{tab.label}</span>
              {locked && (
                <span className="gp-mkt-tab-pro">
                  {tab.requiredPlan === "business" ? "Business" : "Pro"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="gp-mkt-body">
        {activeTab === "resumen" && (
          <NegocioOverview tenantId={tenantId} onNavigate={(t) => handleTabChange(t as NegocioTab)} />
        )}
        {activeTab === "equipo" && <TeamHub tenantId={tenantId} />}
        {activeTab === "horarios" && <HoursManager tenantId={tenantId} />}
        {activeTab === "estadisticas" &&
          (isTabLocked(tabs[3]) ? (
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
          (isTabLocked(tabs[4]) ? (
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
