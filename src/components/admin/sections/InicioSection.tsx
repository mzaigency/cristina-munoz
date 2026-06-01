import { useMemo } from "react";
import AgendaSection from "./AgendaSection";
import ActivitySection from "./ActivitySection";
import { AdminDashboard } from "../AdminDashboard";

interface InicioSectionProps {
  tenantId: string;
  tenantSlug: string;
  /** Sub-tab from URL: "resumen" | "actividad" | "agenda" | "caja" | "espera" | "pedidos" */
  subTab?: string;
  onNavigate: (path: string) => void;
  onSelectClient?: (clientId: string) => void;
}

const InicioSection = ({ tenantId, tenantSlug, subTab, onNavigate, onSelectClient }: InicioSectionProps) => {
  const tab = subTab || "resumen";

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

  if (tab === "actividad") {
    return <ActivitySection tenantId={tenantId} tenantSlug={tenantSlug} onNavigate={onNavigate} />;
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
