import { useState, useEffect } from "react";
import { Wallet, ShoppingCart, Receipt, Lock, History } from "lucide-react";
import { CashRegisterManager } from "../CashRegisterManager";
import { ProductOrdersManager } from "../ProductOrdersManager";
import { LockedFeature } from "../LockedFeature";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useUnseenOrders } from "@/hooks/useUnseenOrders";

interface CajaSectionProps {
  tenantId: string;
  subTab?: string;
  onSubTabChange?: (subTab: string) => void;
  hideTabs?: boolean;
}

type CajaTab = "cobros" | "historial" | "pedidos" | "cierre";

const CajaSection = ({ tenantId, subTab, onSubTabChange, hideTabs }: CajaSectionProps) => {
  const [internalTab, setInternalTab] = useState<CajaTab>("cobros");
  const activeTab: CajaTab = (subTab as CajaTab) || internalTab;
  const setActiveTab = (t: CajaTab) => {
    if (onSubTabChange) onSubTabChange(t);
    else setInternalTab(t);
  };

  const { hasFeature, planSlug } = usePlanLimits(tenantId);
  const unseenOrders = useUnseenOrders(tenantId);
  const cashLocked = !hasFeature("cash_register");

  useEffect(() => {
    if (subTab) return;
    const pending = sessionStorage.getItem("pendingChargeBooking");
    const openCash = sessionStorage.getItem("openCashTab");
    if ((openCash || pending) && hasFeature("cash_register")) {
      setInternalTab("cobros");
      sessionStorage.removeItem("openCashTab");
    }
  }, [hasFeature, subTab]);

  const handleTabChange = (t: CajaTab) => {
    if (t !== "pedidos" && cashLocked) return;
    setActiveTab(t);
  };

  // Una sola fila: antes había estas 3 más otras 3 dentro de CashRegisterManager
  const tabs = [
    { id: "cobros" as CajaTab, label: "Cobrar", icon: Wallet, badge: 0, locked: cashLocked },
    { id: "historial" as CajaTab, label: "Historial", icon: History, badge: 0, locked: cashLocked },
    { id: "pedidos" as CajaTab, label: "Pedidos", icon: ShoppingCart, badge: unseenOrders, locked: false },
    { id: "cierre" as CajaTab, label: "Cierre", icon: Receipt, badge: 0, locked: cashLocked },
  ];

  return (
    <div data-tour-target="caja-cobros" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {!hideTabs && (
        <div className="gp-subtabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`gp-subtab${activeTab === tab.id ? " on" : ""}${tab.locked ? "" : ""}`}
              onClick={() => handleTabChange(tab.id)}
              style={tab.locked ? { opacity: 0.5, cursor: "not-allowed" } : {}}
            >
              {tab.locked ? <Lock style={{ width: 11, height: 11 }} /> : <tab.icon style={{ width: 12, height: 12 }} />}
              {tab.label}
              {tab.locked && <span style={{ fontSize: 9, fontWeight: 800, color: "var(--gp-warn)", background: "var(--gp-warn-soft)", padding: "1px 5px", borderRadius: 99 }}>Pro</span>}
              {tab.badge > 0 && <span className="gp-subtab-count">{tab.badge > 99 ? "99+" : tab.badge}</span>}
            </button>
          ))}
        </div>
      )}

      {(activeTab === "cobros" || activeTab === "historial" || activeTab === "cierre") &&
        (cashLocked ? (
          <LockedFeature
            featureName={activeTab === "cierre" ? "Cierre de caja" : "Caja registradora"}
            currentPlan={planSlug}
            requiredPlan="pro"
            tenantId={tenantId}
            variant="inline"
          />
        ) : (
          <CashRegisterManager
            tenantId={tenantId}
            view={
              activeTab === "cobros" ? "cobrar" : activeTab === "historial" ? "historial" : "cierre"
            }
          />
        ))}

      {activeTab === "pedidos" && <ProductOrdersManager tenantId={tenantId} />}

    </div>
  );
};

export default CajaSection;
