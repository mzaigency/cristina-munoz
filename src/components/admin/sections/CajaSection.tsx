import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CashRegisterManager } from "../CashRegisterManager";
import { ProductOrdersManager } from "../ProductOrdersManager";
import { CashReportsHub } from "../cash-register/CashReportsHub";
import { LockedFeature } from "../LockedFeature";
import { usePlanLimits } from "@/hooks/usePlanLimits";

interface CajaSectionProps {
  tenantId: string;
  subTab?: string;
  onNavigate?: (section: string, subTab?: string) => void;
}

type CajaTab = "cobros" | "historial" | "cierre" | "informes" | "pedidos";

/** Las pestañas las pinta AdminSubNav; aquí solo se despacha por subTab. */
const CajaSection = ({ tenantId, subTab, onNavigate }: CajaSectionProps) => {
  const [legacyTab, setLegacyTab] = useState<CajaTab>("cobros");
  const activeTab: CajaTab = (subTab as CajaTab) || legacyTab;
  const { hasFeature, planSlug } = usePlanLimits(tenantId);
  const cashLocked = !hasFeature("cash_register");
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();

  const handleGoToReports = () => {
    if (onNavigate) {
      onNavigate("negocio", "informes");
    } else if (slug) {
      navigate(`/admin/${slug}/negocio/informes`);
    }
  };

  useEffect(() => {
    if (activeTab === "informes") {
      handleGoToReports();
    }
  }, [activeTab]);

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
        featureName={
          activeTab === "cierre"
            ? "Cierre de caja"
            : activeTab === "informes"
            ? "Informes de caja"
            : "Caja registradora"
        }
        currentPlan={planSlug}
        requiredPlan="pro"
        tenantId={tenantId}
        variant="inline"
      />
    );
  }

  if (activeTab === "informes") {
    return (
      <div data-tour-target="caja-informes">
        <CashReportsHub tenantId={tenantId} />
      </div>
    );
  }

  return (
    <div data-tour-target="caja-cobros">
      <CashRegisterManager
        tenantId={tenantId}
        view={activeTab === "cobros" ? "cobrar" : activeTab === "historial" ? "historial" : "cierre"}
        onGoToReports={handleGoToReports}
      />
    </div>
  );
};

export default CajaSection;
