import { useMemo } from "react";
import AgendaSection from "./AgendaSection";
import { AdminDashboard } from "../AdminDashboard";

interface InicioSectionProps {
  tenantId: string;
  tenantSlug: string;
  /** Sub-tab from URL: "resumen" | "agenda" | "caja" | "espera" | "pedidos" */
  subTab?: string;
  onNavigate: (path: string) => void;
  onSelectClient?: (clientId: string) => void;
}

/**
 * Composite "Inicio" section. Combines the Dashboard ("resumen") with
 * the Agenda's existing sub-tabs (calendar/cash/waitlist/orders), exposed as
 * URL-driven sub-tabs in the AdminLayout sub-nav.
 *
 * URL slug → AgendaSection internal id mapping:
 *   agenda  → calendar
 *   caja    → cash
 *   espera  → waitlist
 *   pedidos → orders
 */
const InicioSection = ({ tenantId, tenantSlug, subTab, onNavigate, onSelectClient }: InicioSectionProps) => {
  const tab = subTab || "resumen";

  // Map URL slug to AgendaSection internal id
  const agendaInternalTab = useMemo(() => {
    switch (tab) {
      case "agenda":
        return "calendar";
      case "caja":
        return "cash";
      case "espera":
        return "waitlist";
      case "pedidos":
        return "orders";
      default:
        return undefined;
    }
  }, [tab]);

  if (tab === "resumen") {
    return (
      <AdminDashboard
        tenantId={tenantId}
        onNavigate={onNavigate}
        onQuickAction={(action) => {
          switch (action) {
            case "new-booking":
              onNavigate(`/admin/${tenantSlug}/inicio/agenda?action=new-booking`);
              break;
            case "new-payment":
              onNavigate(`/admin/${tenantSlug}/inicio/caja`);
              break;
            case "block-slot":
              onNavigate(`/admin/${tenantSlug}/inicio/agenda`);
              break;
            case "new-service":
              onNavigate(`/admin/${tenantSlug}/catalogo/servicios`);
              break;
          }
        }}
      />
    );
  }

  return (
    <AgendaSection
      tenantId={tenantId}
      onSelectClient={onSelectClient}
      subTab={agendaInternalTab}
      hideTabs
      onSubTabChange={(t) => {
        const slug =
          t === "calendar" ? "agenda" : t === "cash" ? "caja" : t === "waitlist" ? "espera" : "pedidos";
        onNavigate(`/admin/${tenantSlug}/inicio/${slug}`);
      }}
    />
  );
};

export default InicioSection;
