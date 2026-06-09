import TeamSection from "./TeamSection";
import ReportsSection from "./ReportsSection";

interface NegocioSectionProps {
  tenantId: string;
  tenantSlug: string;
  /** Sub-tab from URL: "equipo" | "informes" */
  subTab?: string;
}

const NegocioSection = ({ tenantId, subTab }: NegocioSectionProps) => {
  const tab = subTab || "equipo";

  switch (tab) {
    case "informes":
      return <ReportsSection tenantId={tenantId} />;
    case "equipo":
    default:
      return <TeamSection tenantId={tenantId} />;
  }
};

export default NegocioSection;
