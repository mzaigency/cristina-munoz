import { useState, useEffect } from "react";
import { Users, Clock, Percent, Lock } from "lucide-react";
import { StylistsManager } from "../StylistsManager";
import { CommissionsManager } from "../CommissionsManager";
import { BusinessHoursManager } from "../BusinessHoursManager";
import { SeasonalHoursManager } from "../SeasonalHoursManager";
import { LockedFeature } from "../LockedFeature";
import { usePlanLimits, PlanFeature } from "@/hooks/usePlanLimits";

interface TeamSectionProps {
  tenantId: string;
  subTab?: string;
  onSubTabChange?: (subTab: string) => void;
}

type TeamTab = "stylists" | "hours" | "commissions";

interface TabConfig {
  id: TeamTab;
  label: string;
  icon: React.ElementType;
  requiredFeature?: PlanFeature;
  requiredPlan?: string;
}

const TeamSection = ({ tenantId, subTab, onSubTabChange }: TeamSectionProps) => {
  const [internalTab, setInternalTab] = useState<TeamTab>("stylists");
  const activeTab: TeamTab = (subTab as TeamTab) || internalTab;
  const setActiveTab = (t: TeamTab) => {
    if (onSubTabChange) onSubTabChange(t);
    else setInternalTab(t);
  };
  const { hasFeature, planSlug } = usePlanLimits(tenantId);

  useEffect(() => {
    if (subTab) return;
    const legacy = sessionStorage.getItem("openTeamSubTab");
    if (legacy && ["stylists", "hours", "commissions"].includes(legacy)) {
      setInternalTab(legacy as TeamTab);
      sessionStorage.removeItem("openTeamSubTab");
    }
  }, [subTab]);

  const tabs: TabConfig[] = [
    { id: "stylists", label: "Staff", icon: Users },
    { id: "hours", label: "Horarios", icon: Clock },
    { id: "commissions", label: "Comisiones", icon: Percent, requiredFeature: "commissions", requiredPlan: "business" },
  ];

  const isTabLocked = (tab: TabConfig): boolean => {
    if (!tab.requiredFeature) return false;
    return !hasFeature(tab.requiredFeature);
  };

  const handleTabChange = (tabId: TeamTab) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (tab && !isTabLocked(tab)) setActiveTab(tabId);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div className="gp-subtabs">
        {tabs.map((tab) => {
          const locked = isTabLocked(tab);
          return (
            <button
              key={tab.id}
              className={`gp-subtab${activeTab === tab.id ? " on" : ""}`}
              onClick={() => handleTabChange(tab.id)}
              style={locked ? { opacity: 0.5, cursor: "not-allowed" } : {}}
            >
              {locked ? <Lock style={{ width: 11, height: 11 }} /> : <tab.icon style={{ width: 12, height: 12 }} />}
              {tab.label}
              {locked && (
                <span style={{ fontSize: 9, fontWeight: 800, color: "var(--gp-warn)", background: "var(--gp-warn-soft)", padding: "1px 5px", borderRadius: 99 }}>
                  Business
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeTab === "stylists" && (
        <StylistsManager tenantId={tenantId} />
      )}

      {activeTab === "hours" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <BusinessHoursManager tenantId={tenantId} />
          <SeasonalHoursManager tenantId={tenantId} />
        </div>
      )}

      {activeTab === "commissions" && (
        isTabLocked(tabs[2]) ? (
          <LockedFeature featureName="Comisiones" currentPlan={planSlug} requiredPlan="business" tenantId={tenantId} variant="inline" />
        ) : (
          <CommissionsManager tenantId={tenantId} />
        )
      )}
    </div>
  );
};

export default TeamSection;
