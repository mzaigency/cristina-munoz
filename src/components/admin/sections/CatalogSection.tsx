import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Scissors, ShoppingBag, Package, Lock, Sparkles } from "lucide-react";
import { ServicesManager } from "../ServicesManager";
import { ProductsManager } from "../ProductsManager";
import { ServicePackagesManager } from "../ServicePackagesManager";
import { LockedFeature } from "../LockedFeature";
import { AgendaImporter } from "../import/AgendaImporter";
import { usePlanLimits, PlanFeature } from "@/hooks/usePlanLimits";

interface CatalogSectionProps {
  tenantId: string;
  subTab?: string;
  onSubTabChange?: (subTab: string) => void;
  hideTabs?: boolean;
}

type CatalogTab = "services" | "products" | "packages";

interface TabConfig {
  id: CatalogTab;
  label: string;
  icon: React.ElementType;
  requiredFeature?: PlanFeature;
  requiredPlan?: string;
}

const CatalogSection = ({ tenantId, subTab, onSubTabChange, hideTabs }: CatalogSectionProps) => {
  const [internalTab, setInternalTab] = useState<CatalogTab>("services");
  const activeTab: CatalogTab = (subTab as CatalogTab) || internalTab;
  const setActiveTab = (t: CatalogTab) => {
    if (onSubTabChange) onSubTabChange(t);
    else setInternalTab(t);
  };
  const { hasFeature, planSlug } = usePlanLimits(tenantId);

  useEffect(() => {
    if (subTab) return;
    const legacy = sessionStorage.getItem("openCatalogSubTab");
    if (legacy && ["services", "products", "packages"].includes(legacy)) {
      setInternalTab(legacy as CatalogTab);
      sessionStorage.removeItem("openCatalogSubTab");
    }
  }, [subTab]);

  const tabs: TabConfig[] = [
    { id: "services", label: "Servicios", icon: Scissors },
    { id: "products", label: "Productos", icon: ShoppingBag },
    { id: "packages", label: "Paquetes", icon: Package, requiredFeature: "packages", requiredPlan: "pro" },
  ];

  const isTabLocked = (tab: TabConfig): boolean => {
    if (!tab.requiredFeature) return false;
    return !hasFeature(tab.requiredFeature);
  };

  const handleTabChange = (tabId: CatalogTab) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (tab && !isTabLocked(tab)) setActiveTab(tabId);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {!hideTabs && (
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
                    Pro
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {activeTab === "services" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Sheet>
            <SheetTrigger asChild>
              <button className="gp-btn sm" style={{ alignSelf: "flex-start" }}>
                <Sparkles style={{ width: 13, height: 13 }} />
                Importar carta desde foto con IA
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[92vh] overflow-y-auto rounded-t-2xl">
              <SheetHeader className="text-left mb-2">
                <SheetTitle>Importar servicios</SheetTitle>
              </SheetHeader>
              <AgendaImporter tenantId={tenantId} defaultMode="services" />
            </SheetContent>
          </Sheet>
          <ServicesManager tenantId={tenantId} />
        </div>
      )}

      {activeTab === "products" && (
        <ProductsManager tenantId={tenantId} />
      )}

      {activeTab === "packages" && (
        isTabLocked(tabs[2]) ? (
          <LockedFeature featureName="Paquetes" currentPlan={planSlug} requiredPlan="pro" tenantId={tenantId} variant="inline" />
        ) : (
          <ServicePackagesManager tenantId={tenantId} />
        )
      )}
    </div>
  );
};

export default CatalogSection;
