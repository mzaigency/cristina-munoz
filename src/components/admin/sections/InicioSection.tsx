import ActivitySection from "./ActivitySection";
import { AdminDashboard } from "../AdminDashboard";

interface InicioSectionProps {
  tenantId: string;
  tenantSlug: string;
  /** Sub-tab from URL: "resumen" | "actividad" */
  subTab?: string;
  onNavigate: (path: string) => void;
  onSelectClient?: (clientId: string) => void;
}

/**
 * Inicio is now a pure overview section: Resumen (Dashboard) + Actividad (feed).
 * Operational tabs (Agenda, Caja, Espera, Pedidos) have moved to their own
 * top-level sections in the new 7-section navigation. Legacy URLs are
 * transparently redirected by TenantAdmin (see LEGACY_URL_REDIRECTS).
 */
const InicioSection = ({ tenantId, tenantSlug, subTab, onNavigate, onSelectClient }: InicioSectionProps) => {
  const tab = subTab || "resumen";

  if (tab === "actividad") {
    return <ActivitySection tenantId={tenantId} tenantSlug={tenantSlug} onNavigate={onNavigate} />;
  }

  return (
    <AdminDashboard
      tenantId={tenantId}
      onNavigate={onNavigate}
      onQuickAction={(action) => {
        switch (action) {
          case "new-booking":
            onNavigate(`/admin/${tenantSlug}/agenda/dia?action=new-booking`);
            break;
          case "new-payment":
            onNavigate(`/admin/${tenantSlug}/caja/cobros`);
            break;
          case "block-slot":
            onNavigate(`/admin/${tenantSlug}/agenda/dia`);
            break;
          case "new-service":
            onNavigate(`/admin/${tenantSlug}/catalogo/services`);
            break;
        }
      }}
    />
  );
};

export default InicioSection;
