import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Target, FileText, Lock, Sparkles } from "lucide-react";
import { BusinessStats } from "../BusinessStats";
import { MonthlyGoals } from "../MonthlyGoals";
import { PDFReportsGenerator } from "../PDFReportsGenerator";
import { LockedFeature } from "../LockedFeature";
import { TenantFeedAnalytics } from "../TenantFeedAnalytics";
import { usePlanLimits, PlanFeature } from "@/hooks/usePlanLimits";
import { cn } from "@/lib/utils";

interface ReportsSectionProps {
  tenantId: string;
}

type ReportsTab = "stats" | "goals" | "pdf";

interface TabConfig {
  id: ReportsTab;
  label: string;
  icon: React.ElementType;
  requiredFeature?: PlanFeature;
  requiredPlan?: string;
}

const ReportsSection = ({ tenantId }: ReportsSectionProps) => {
  const [activeTab, setActiveTab] = useState<ReportsTab>("stats");
  const { hasFeature, planSlug } = usePlanLimits(tenantId);

  useEffect(() => {
    const subTab = sessionStorage.getItem("openReportsSubTab");
    if (subTab && ["stats", "goals", "pdf"].includes(subTab)) {
      setActiveTab(subTab as ReportsTab);
      sessionStorage.removeItem("openReportsSubTab");
    }
  }, []);

  const tabs: TabConfig[] = [
    { id: "stats", label: "Stats", icon: BarChart3, requiredFeature: "advanced_analytics", requiredPlan: "pro" },
    { id: "goals", label: "Objetivos", icon: Target, requiredFeature: "monthly_goals", requiredPlan: "business" },
    { id: "pdf", label: "Reportes", icon: FileText, requiredFeature: "advanced_analytics", requiredPlan: "pro" },
  ];

  const isTabLocked = (tab: TabConfig): boolean => {
    if (!tab.requiredFeature) return false;
    return !hasFeature(tab.requiredFeature);
  };

  const handleTabChange = (tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (tab && !isTabLocked(tab)) {
      setActiveTab(tabId as ReportsTab);
    }
  };

  // Find first unlocked tab
  const firstUnlocked = tabs.find((t) => !isTabLocked(t));
  const currentTab = isTabLocked(tabs.find((t) => t.id === activeTab)!) ? (firstUnlocked?.id || "stats") : activeTab;

  return (
    <div className="space-y-4">
      <Tabs value={currentTab} onValueChange={handleTabChange}>
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
                    {tab.requiredPlan === "business" ? "Business" : "Pro"}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="stats" className="mt-4">
          {isTabLocked(tabs[0]) ? (
            <LockedFeature featureName="Estadísticas" currentPlan={planSlug} requiredPlan="pro" tenantId={tenantId} variant="inline" />
          ) : (
            <BusinessStats tenantId={tenantId} />
          )}
        </TabsContent>

        <TabsContent value="goals" className="mt-4">
          {isTabLocked(tabs[1]) ? (
            <LockedFeature featureName="Objetivos" currentPlan={planSlug} requiredPlan="business" tenantId={tenantId} variant="inline" />
          ) : (
            <MonthlyGoals tenantId={tenantId} />
          )}
        </TabsContent>

        <TabsContent value="pdf" className="mt-4">
          {isTabLocked(tabs[2]) ? (
            <LockedFeature featureName="Reportes PDF" currentPlan={planSlug} requiredPlan="pro" tenantId={tenantId} variant="inline" />
          ) : (
            <PDFReportsGenerator tenantId={tenantId} tenantName="" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsSection;
