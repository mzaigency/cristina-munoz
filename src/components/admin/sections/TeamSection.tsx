import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Clock, Percent, Lock } from "lucide-react";
import { StylistsManager } from "../StylistsManager";
import { CommissionsManager } from "../CommissionsManager";
import { BusinessHoursManager } from "../BusinessHoursManager";
import { LockedFeature } from "../LockedFeature";
import { usePlanLimits, PlanFeature } from "@/hooks/usePlanLimits";
import { cn } from "@/lib/utils";

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

  const handleTabChange = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab && !isTabLocked(tab)) {
      setActiveTab(tabId as TeamTab);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full flex overflow-x-auto no-scrollbar bg-muted/50 p-1 rounded-lg">
          {tabs.map((tab) => {
            const locked = isTabLocked(tab);
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                disabled={locked}
                className={cn(
                  "flex-1 min-w-fit flex items-center gap-1.5 text-xs px-3 py-2",
                  "data-[state=active]:bg-background data-[state=active]:shadow-sm",
                  locked && "opacity-50 cursor-not-allowed"
                )}
              >
                {locked ? <Lock className="h-3.5 w-3.5" /> : <tab.icon className="h-3.5 w-3.5" />}
                <span>{tab.label}</span>
                {locked && (
                  <span className="hidden md:inline text-[10px] text-amber-600 dark:text-amber-400 ml-1">
                    Business
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="stylists" className="mt-4">
          <StylistsManager tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="hours" className="mt-4">
          <BusinessHoursManager tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="commissions" className="mt-4">
          {isTabLocked(tabs[2]) ? (
            <LockedFeature featureName="Comisiones" currentPlan={planSlug} requiredPlan="business" tenantId={tenantId} variant="inline" />
          ) : (
            <CommissionsManager tenantId={tenantId} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamSection;
