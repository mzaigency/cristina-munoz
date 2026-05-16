import TeamSection from "./TeamSection";
import ReportsSection from "./ReportsSection";
import SettingsSection from "./SettingsSection";

interface NegocioSectionProps {
  tenantId: string;
  tenantSlug: string;
  /** Sub-tab from URL: "equipo" | "informes" | "ajustes" */
  subTab?: string;
}

/**
 * Composite "Negocio" section. Routes URL sub-tab to the appropriate child section.
 * The sub-nav for Negocio is rendered by AdminLayout (sticky bar above content),
 * so this component is purely a router/switch.
 *
 * Each child section keeps its own internal sub-sub-tabs (e.g. team has stylists|hours|commissions).
 */
const NegocioSection = ({ tenantId, tenantSlug, subTab }: NegocioSectionProps) => {
  const tab = subTab || "equipo";

  switch (tab) {
    case "informes":
      return <ReportsSection tenantId={tenantId} />;
    case "ajustes":
      return <SettingsSection tenantId={tenantId} tenantSlug={tenantSlug} />;
    case "equipo":
    default:
      return <TeamSection tenantId={tenantId} />;
  }
};

export default NegocioSection;
