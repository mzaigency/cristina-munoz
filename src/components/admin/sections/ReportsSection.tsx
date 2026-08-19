import { useState, useEffect } from "react";
import { BarChart3, Target, FileText, Lock, Sparkles } from "lucide-react";
import { BusinessStats } from "../BusinessStats";
import { MonthlyGoals } from "../MonthlyGoals";
import { PDFReportsGenerator } from "../PDFReportsGenerator";
import { LockedFeature } from "../LockedFeature";
import { TenantFeedAnalytics } from "../TenantFeedAnalytics";
import { usePlanLimits, PlanFeature } from "@/hooks/usePlanLimits";
import { supabase } from "@/integrations/supabase/client";

interface ReportsSectionProps {
  tenantId: string;
  subTab?: string;
  onSubTabChange?: (subTab: string) => void;
}

type ReportsTab = "stats" | "feed" | "goals" | "pdf";

interface TabConfig {
  id: ReportsTab;
  label: string;
  icon: React.ElementType;
  requiredFeature?: PlanFeature;
  requiredPlan?: string;
}

const ReportsSection = ({ tenantId, subTab, onSubTabChange }: ReportsSectionProps) => {
  const [internalTab, setInternalTab] = useState<ReportsTab>("stats");
  const activeTab: ReportsTab = (subTab as ReportsTab) || internalTab;
  const setActiveTab = (t: ReportsTab) => {
    if (onSubTabChange) onSubTabChange(t);
    else setInternalTab(t);
  };
  const { hasFeature, planSlug } = usePlanLimits(tenantId);
  const [tenantName, setTenantName] = useState<string>("Salón");

  useEffect(() => {
    supabase.from("tenants").select("name").eq("id", tenantId).maybeSingle()
      .then(({ data }) => { if (data?.name) setTenantName(data.name); });
  }, [tenantId]);

  useEffect(() => {
    if (subTab) return;
    const legacy = sessionStorage.getItem("openReportsSubTab");
    if (legacy && ["stats", "feed", "goals", "pdf"].includes(legacy)) {
      setInternalTab(legacy as ReportsTab);
      sessionStorage.removeItem("openReportsSubTab");
    }
  }, [subTab]);

  const tabs: TabConfig[] = [
    { id: "stats", label: "Stats", icon: BarChart3, requiredFeature: "advanced_analytics", requiredPlan: "pro" },
    { id: "feed", label: "Feed", icon: Sparkles },
    { id: "goals", label: "Objetivos", icon: Target, requiredFeature: "monthly_goals", requiredPlan: "business" },
    { id: "pdf", label: "Reportes", icon: FileText, requiredFeature: "advanced_analytics", requiredPlan: "pro" },
  ];

  const isTabLocked = (tab: TabConfig): boolean => {
    if (!tab.requiredFeature) return false;
    return !hasFeature(tab.requiredFeature);
  };

  const handleTabChange = (tabId: ReportsTab) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (tab && !isTabLocked(tab)) setActiveTab(tabId);
  };

  // If current tab is locked, fall back to first unlocked
  const lockedActive = isTabLocked(tabs.find((t) => t.id === activeTab)!);
  const currentTab = lockedActive
    ? (tabs.find((t) => !isTabLocked(t))?.id || "stats")
    : activeTab;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div className="glow-subtabs">
        {tabs.map((tab) => {
          const locked = isTabLocked(tab);
          return (
            <button
              key={tab.id}
              className={`glow-subtab${currentTab === tab.id ? " glow-subtab--on" : ""}`}
              onClick={() => handleTabChange(tab.id)}
              style={locked ? { opacity: 0.5, cursor: "not-allowed" } : {}}
            >
              {locked ? <Lock style={{ width: 11, height: 11 }} /> : <tab.icon style={{ width: 12, height: 12 }} />}
              {tab.label}
              {locked && (
                <span style={{ fontSize: 9, fontWeight: 800, color: "var(--glow-warn-ink)", background: "var(--glow-warn-soft)", padding: "1px 5px", borderRadius: 99 }}>
                  {tab.requiredPlan === "business" ? "Business" : "Pro"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {currentTab === "stats" && (
        isTabLocked(tabs[0]) ? (
          <LockedFeature featureName="Estadísticas" currentPlan={planSlug} requiredPlan="pro" tenantId={tenantId} variant="inline" />
        ) : (
          <BusinessStats tenantId={tenantId} />
        )
      )}

      {currentTab === "feed" && (
        <TenantFeedAnalytics tenantId={tenantId} />
      )}

      {currentTab === "goals" && (
        isTabLocked(tabs[2]) ? (
          <LockedFeature featureName="Objetivos" currentPlan={planSlug} requiredPlan="business" tenantId={tenantId} variant="inline" />
        ) : (
          <MonthlyGoals tenantId={tenantId} />
        )
      )}

      {currentTab === "pdf" && (
        isTabLocked(tabs[3]) ? (
          <LockedFeature featureName="Reportes PDF" currentPlan={planSlug} requiredPlan="pro" tenantId={tenantId} variant="inline" />
        ) : (
          <PDFReportsGenerator tenantId={tenantId} tenantName={tenantName} />
        )
      )}
    </div>
  );
};

export default ReportsSection;
