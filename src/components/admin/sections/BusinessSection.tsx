import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, Percent, Package, ShoppingBag, Target, BarChart3, Lock } from "lucide-react";
import { CashRegisterManager } from "../CashRegisterManager";
import { PromotionsManager } from "../PromotionsManager";
import { ServicePackagesManager } from "../ServicePackagesManager";
import { ProductsManager } from "../ProductsManager";
import { MonthlyGoals } from "../MonthlyGoals";
import { BusinessStats } from "../BusinessStats";
import { PDFReportsGenerator } from "../PDFReportsGenerator";
import { LockedFeature } from "../LockedFeature";
import { usePlanLimits, PlanFeature } from "@/hooks/usePlanLimits";
import { cn } from "@/lib/utils";

interface BusinessSectionProps {
  tenantId: string;
}

type BusinessTab = "cash" | "promos" | "packages" | "products" | "goals" | "stats";

interface TabConfig {
  id: BusinessTab;
  label: string;
  icon: React.ElementType;
  requiredFeature?: PlanFeature;
  requiredPlan?: string;
}

const BusinessSection = ({ tenantId }: BusinessSectionProps) => {
  const [activeTab, setActiveTab] = useState<BusinessTab>("cash");
  const { hasFeature, planSlug, loading } = usePlanLimits(tenantId);

  // Check for pending charge from agenda and auto-open cash tab
  useEffect(() => {
    const openCashTab = sessionStorage.getItem("openCashTab");
    const pendingBooking = sessionStorage.getItem("pendingChargeBooking");

    if ((openCashTab || pendingBooking) && hasFeature("cash_register")) {
      setActiveTab("cash");
      sessionStorage.removeItem("openCashTab");
    }
  }, [hasFeature]);

  const tabs: TabConfig[] = [
    { id: "cash", label: "Caja", icon: Wallet, requiredFeature: "cash_register", requiredPlan: "pro" },
    { id: "promos", label: "Promos", icon: Percent, requiredFeature: "promotions", requiredPlan: "pro" },
    { id: "packages", label: "Paquetes", icon: Package, requiredFeature: "packages", requiredPlan: "pro" },
    { id: "products", label: "Productos", icon: ShoppingBag },
    { id: "goals", label: "Objetivos", icon: Target, requiredFeature: "monthly_goals", requiredPlan: "business" },
    { id: "stats", label: "Stats", icon: BarChart3, requiredFeature: "advanced_analytics", requiredPlan: "pro" },
  ];

  const isTabLocked = (tab: TabConfig): boolean => {
    if (!tab.requiredFeature) return false;
    return !hasFeature(tab.requiredFeature);
  };

  const handleTabChange = (tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (tab && !isTabLocked(tab)) {
      setActiveTab(tabId as BusinessTab);
    }
  };

  const renderTabContent = (tab: TabConfig, content: React.ReactNode) => {
    if (isTabLocked(tab)) {
      return (
        <LockedFeature
          featureName={tab.label}
          currentPlan={planSlug}
          requiredPlan={tab.requiredPlan || "pro"}
          tenantId={tenantId}
          variant="inline"
        />
      );
    }
    return content;
  };

  // Find first available tab
  const getDefaultTab = () => {
    const availableTabs = tabs.filter((t) => !isTabLocked(t));
    return availableTabs.length > 0 ? availableTabs[0].id : "products";
  };

  // If loading, set products as default (always available)
  const currentActiveTab = loading ? "products" : activeTab;

  return (
    <div className="space-y-4">
      <Tabs value={currentActiveTab} onValueChange={handleTabChange}>
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
                  locked && "opacity-50 cursor-not-allowed",
                )}
              >
                {locked ? <Lock className="h-3.5 w-3.5" /> : <tab.icon className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{tab.label}</span>
                {locked && (
                  <span className="hidden md:inline text-[10px] text-amber-600 dark:text-amber-400 ml-1">
                    {tab.requiredPlan === "business" ? "Business" : "Pro"}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="cash" className="mt-4">
          {renderTabContent(tabs[0], <CashRegisterManager tenantId={tenantId} />)}
        </TabsContent>

        <TabsContent value="promos" className="mt-4">
          {renderTabContent(tabs[1], <PromotionsManager tenantId={tenantId} />)}
        </TabsContent>

        <TabsContent value="packages" className="mt-4">
          {renderTabContent(tabs[2], <ServicePackagesManager tenantId={tenantId} />)}
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <ProductsManager tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="goals" className="mt-4">
          {renderTabContent(tabs[4], <MonthlyGoals tenantId={tenantId} />)}
        </TabsContent>

        <TabsContent value="stats" className="mt-4 space-y-6">
          {renderTabContent(
            tabs[5],
            <>
              <BusinessStats tenantId={tenantId} />
              <PDFReportsGenerator tenantId={tenantId} tenantName="" />
            </>,
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BusinessSection;
