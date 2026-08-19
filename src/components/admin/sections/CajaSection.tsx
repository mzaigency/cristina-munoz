import { useState, useEffect } from "react";
import { CashRegisterManager } from "../CashRegisterManager";
import { ProductOrdersManager } from "../ProductOrdersManager";
import { LockedFeature } from "../LockedFeature";
import { usePlanLimits } from "@/hooks/usePlanLimits";

interface CajaSectionProps {
  tenantId: string;
  subTab?: string;
}

type CajaTab = "cobros" | "historial" | "pedidos" | "cierre";

/** Las pestañas las pinta AdminSubNav; aquí solo se despacha por subTab. */
const CajaSection = ({ tenantId, subTab }: CajaSectionProps) => {
  const [legacyTab, setLegacyTab] = useState<CajaTab>("cobros");
  const activeTab: CajaTab = (subTab as CajaTab) || legacyTab;
  const { hasFeature, planSlug } = usePlanLimits(tenantId);
  const cashLocked = !hasFeature("cash_register");

  useEffect(() => {
    if (subTab) return;
    const pending = sessionStorage.getItem("pendingChargeBooking");
    const openCash = sessionStorage.getItem("openCashTab");
    if ((openCash || pending) && hasFeature("cash_register")) {
      setLegacyTab("cobros");
      sessionStorage.removeItem("openCashTab");
    }
  }, [hasFeature, subTab]);

  if (activeTab === "pedidos") return <ProductOrdersManager tenantId={tenantId} />;

  if (cashLocked) {
    return (
      <LockedFeature
        featureName={activeTab === "cierre" ? "Cierre de caja" : "Caja registradora"}
        currentPlan={planSlug}
        requiredPlan="pro"
        tenantId={tenantId}
        variant="inline"
      />
    );
  }

  return (
    <div data-tour-target="caja-cobros">
      <CashRegisterManager
        tenantId={tenantId}
        view={activeTab === "cobros" ? "cobrar" : activeTab === "historial" ? "historial" : "cierre"}
      />
    </div>
  );
};

export default CajaSection;
