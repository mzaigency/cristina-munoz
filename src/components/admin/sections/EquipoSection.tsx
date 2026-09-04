import { useState } from "react";
import { TeamHub } from "../negocio/TeamHub";
import { HoursManager } from "../negocio/HoursManager";
import { AllAbsencesTab } from "../negocio/AllAbsencesTab";

interface EquipoSectionProps {
  tenantId: string;
  tenantSlug?: string;
  subTab?: string;
  onSubTabChange?: (subTab: string) => void;
}

export type EquipoTab = "personal" | "horarios" | "ausencias";

export function EquipoSection({
  tenantId,
  subTab,
  onSubTabChange,
}: EquipoSectionProps) {
  const validTabs: EquipoTab[] = ["personal", "horarios", "ausencias"];
  const [internalTab, setInternalTab] = useState<EquipoTab>("personal");
  const activeTab: EquipoTab = validTabs.includes(subTab as EquipoTab)
    ? (subTab as EquipoTab)
    : internalTab;

  const setActiveTab = (t: EquipoTab) => {
    if (onSubTabChange) onSubTabChange(t);
    else setInternalTab(t);
  };

  return (
    <div className="glow-mkt">
      <div className="glow-mkt-body">
        {activeTab === "personal" && (
          <div data-tour-target="equipo-personal">
            <TeamHub
              tenantId={tenantId}
              onNavigateTab={(t) => {
                if (t === "horarios") setActiveTab("horarios");
              }}
            />
          </div>
        )}
        {activeTab === "horarios" && (
          <div data-tour-target="equipo-horarios">
            <HoursManager tenantId={tenantId} viewMode="horarios" initialMainTab="salon" />
          </div>
        )}
        {activeTab === "ausencias" && (
          <div data-tour-target="equipo-ausencias">
            <AllAbsencesTab tenantId={tenantId} />
          </div>
        )}
      </div>
    </div>
  );
}

export default EquipoSection;
