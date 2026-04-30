import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scissors, ShoppingBag, Package, Percent, Lock, ShoppingCart } from "lucide-react";
import { ServicesManager } from "../ServicesManager";
import { ProductsManager } from "../ProductsManager";
import { ServicePackagesManager } from "../ServicePackagesManager";
import { PromotionsManager } from "../PromotionsManager";
import { ProductOrdersManager } from "../ProductOrdersManager";
import { LockedFeature } from "../LockedFeature";
import { usePlanLimits, PlanFeature } from "@/hooks/usePlanLimits";
import { useUnseenOrders } from "@/hooks/useUnseenOrders";
import { cn } from "@/lib/utils";

interface CatalogSectionProps {
  tenantId: string;
}

type CatalogTab = "services" | "products" | "orders" | "packages" | "promos";

interface TabConfig {
  id: CatalogTab;
  label: string;
  icon: React.ElementType;
  requiredFeature?: PlanFeature;
  requiredPlan?: string;
}

const CatalogSection = ({ tenantId }: CatalogSectionProps) => {
  const [activeTab, setActiveTab] = useState<CatalogTab>("services");
  const { hasFeature, planSlug } = usePlanLimits(tenantId);

  useEffect(() => {
    const subTab = sessionStorage.getItem("openCatalogSubTab");
    if (subTab && ["services", "products", "orders", "packages", "promos"].includes(subTab)) {
      setActiveTab(subTab as CatalogTab);
      sessionStorage.removeItem("openCatalogSubTab");
    }
  }, []);

  const tabs: TabConfig[] = [
    { id: "services", label: "Servicios", icon: Scissors },
    { id: "products", label: "Productos", icon: ShoppingBag },
    { id: "orders", label: "Pedidos", icon: ShoppingCart },
    { id: "packages", label: "Paquetes", icon: Package, requiredFeature: "packages", requiredPlan: "pro" },
    { id: "promos", label: "Promos", icon: Percent, requiredFeature: "promotions", requiredPlan: "pro" },
  ];

  const isTabLocked = (tab: TabConfig): boolean => {
    if (!tab.requiredFeature) return false;
    return !hasFeature(tab.requiredFeature);
  };

  const handleTabChange = (tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (tab && !isTabLocked(tab)) {
      setActiveTab(tabId as CatalogTab);
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
                    Pro
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="services" className="mt-4">
          <ServicesManager tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <ProductsManager tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <ProductOrdersManager tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="packages" className="mt-4">
          {isTabLocked(tabs[2]) ? (
            <LockedFeature featureName="Paquetes" currentPlan={planSlug} requiredPlan="pro" tenantId={tenantId} variant="inline" />
          ) : (
            <ServicePackagesManager tenantId={tenantId} />
          )}
        </TabsContent>

        <TabsContent value="promos" className="mt-4">
          {isTabLocked(tabs[3]) ? (
            <LockedFeature featureName="Promociones" currentPlan={planSlug} requiredPlan="pro" tenantId={tenantId} variant="inline" />
          ) : (
            <PromotionsManager tenantId={tenantId} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CatalogSection;
