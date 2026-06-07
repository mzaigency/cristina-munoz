import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Wallet, ShoppingCart, Receipt, Lock } from "lucide-react";
import { CashRegisterManager } from "../CashRegisterManager";
import { ProductOrdersManager } from "../ProductOrdersManager";
import { LockedFeature } from "../LockedFeature";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useUnseenOrders } from "@/hooks/useUnseenOrders";
import { cn } from "@/lib/utils";

interface CajaSectionProps {
  tenantId: string;
  /** Controlled sub-tab from URL: cobros | pedidos | cierre */
  subTab?: string;
  onSubTabChange?: (subTab: string) => void;
  hideTabs?: boolean;
}

type CajaTab = "cobros" | "pedidos" | "cierre";

/**
 * Top-level "Caja" section. Groups all money-of-the-day flows:
 *  - Cobros  → CashRegisterManager (POS / cobros)
 *  - Pedidos → ProductOrdersManager (shop orders)
 *  - Cierre  → Daily closing UI (placeholder — uses existing cash_register data)
 *
 * Functionality unchanged from previous Inicio › Caja / Pedidos tabs.
 */
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

  // Legacy sessionStorage compat (one-time hand-off from old links)
  useEffect(() => {
    if (subTab) return;
    const pending = sessionStorage.getItem("pendingChargeBooking");
    const openCash = sessionStorage.getItem("openCashTab");
    if ((openCash || pending) && hasFeature("cash_register")) {
      setInternalTab("cobros");
      sessionStorage.removeItem("openCashTab");
    }
  }, [hasFeature, subTab]);

  const handleTabChange = (value: string) => {
    if ((value === "cobros" || value === "cierre") && cashLocked) return;
    setActiveTab(value as CajaTab);
  };

  const tabs = [
    { id: "cobros" as CajaTab, label: "Cobros", icon: Wallet, badge: 0, locked: cashLocked },
    { id: "pedidos" as CajaTab, label: "Pedidos", icon: ShoppingCart, badge: unseenOrders, locked: false },
    { id: "cierre" as CajaTab, label: "Cierre", icon: Receipt, badge: 0, locked: cashLocked },
  ];

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        {!hideTabs && (
          <TabsList className="w-full flex bg-muted/50 p-1 rounded-lg">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                disabled={tab.locked}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 text-xs sm:text-sm px-2 sm:px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm relative",
                  tab.locked && "opacity-50 cursor-not-allowed"
                )}
              >
                {tab.locked ? <Lock className="h-4 w-4" /> : <tab.icon className="h-4 w-4" />}
                <span>{tab.label}</span>
                {tab.badge > 0 && activeTab !== tab.id && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center text-xs px-1.5">
                    {tab.badge > 99 ? "99+" : tab.badge}
                  </Badge>
                )}
                {tab.locked && (
                  <span className="text-[10px] text-amber-600 ml-0.5">Pro</span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        )}

        <TabsContent value="cobros" className="mt-4">
          {cashLocked ? (
            <LockedFeature
              featureName="Caja Registradora"
              currentPlan={planSlug}
              requiredPlan="pro"
              tenantId={tenantId}
              variant="inline"
            />
          ) : (
            <CashRegisterManager tenantId={tenantId} />
          )}
        </TabsContent>

        <TabsContent value="pedidos" className="mt-4">
          <ProductOrdersManager tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="cierre" className="mt-4">
          {cashLocked ? (
            <LockedFeature
              featureName="Cierre de caja"
              currentPlan={planSlug}
              requiredPlan="pro"
              tenantId={tenantId}
              variant="inline"
            />
          ) : (
            <div className="rounded-2xl border bg-card p-8 text-center space-y-3">
              <Receipt className="h-10 w-10 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-bold">Cierre del día</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Próximamente: arqueo automático del día con resumen de cobros por método
                de pago, descuadres y exportación a PDF. Mientras tanto, encuentra el detalle
                completo en la pestaña <strong>Cobros</strong>.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CajaSection;
