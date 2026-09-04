import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Sparkles } from "lucide-react";
import { ServicesManager } from "../ServicesManager";
import { ProductsManager } from "../ProductsManager";
import { ServicePackagesManager } from "../ServicePackagesManager";
import { PromotionsManager } from "../PromotionsManager";
import { LockedFeature } from "../LockedFeature";
import { AgendaImporter } from "../import/AgendaImporter";
import { usePlanLimits } from "@/hooks/usePlanLimits";

interface CatalogSectionProps {
  tenantId: string;
  subTab?: string;
}

type CatalogTab = "services" | "products" | "packages" | "promos";

/** Las pestañas las pinta AdminSubNav; aquí solo se despacha por subTab. */
const CatalogSection = ({ tenantId, subTab }: CatalogSectionProps) => {
  const [legacyTab, setLegacyTab] = useState<CatalogTab>("services");
  const activeTab: CatalogTab = (subTab as CatalogTab) || legacyTab;
  const { hasFeature, planSlug } = usePlanLimits(tenantId);

  useEffect(() => {
    if (subTab) return;
    const legacy = sessionStorage.getItem("openCatalogSubTab");
    if (
      legacy === "services" ||
      legacy === "products" ||
      legacy === "packages" ||
      legacy === "promos"
    ) {
      setLegacyTab(legacy as CatalogTab);
      sessionStorage.removeItem("openCatalogSubTab");
    }
  }, [subTab]);

  if (activeTab === "products") return <ProductsManager tenantId={tenantId} />;

  if (activeTab === "packages") {
    return hasFeature("packages") ? (
      <ServicePackagesManager tenantId={tenantId} />
    ) : (
      <LockedFeature
        featureName="Paquetes"
        currentPlan={planSlug}
        requiredPlan="pro"
        tenantId={tenantId}
        variant="inline"
      />
    );
  }

  if (activeTab === "promos") {
    return hasFeature("promotions") ? (
      <PromotionsManager tenantId={tenantId} />
    ) : (
      <LockedFeature
        featureName="Promociones y Cupones"
        currentPlan={planSlug}
        requiredPlan="pro"
        tenantId={tenantId}
        variant="inline"
      />
    );
  }

  return (
    <div
      data-tour-target="catalogo-services"
      style={{ display: "flex", flexDirection: "column", gap: "var(--glow-s3)" }}
    >
      <Sheet>
        <SheetTrigger asChild>
          <button className="glow-btn glow-btn--sm" style={{ alignSelf: "flex-start" }}>
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
  );
};

export default CatalogSection;
