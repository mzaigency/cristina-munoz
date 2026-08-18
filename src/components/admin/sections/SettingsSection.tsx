import TenantSettings from "../TenantSettings";
import { NotificationSettings } from "../NotificationSettings";
import { SubscriptionManager } from "../SubscriptionManager";

interface SettingsSectionProps {
  tenantId: string;
  tenantSlug: string;
  /** Sub-tab from URL: "general"|"plan"|"alertas"*/ subTab?: string;
} const SettingsSection = ({ tenantId, tenantSlug, subTab }: SettingsSectionProps) => { const tab = subTab ||"general";

  switch (tab) {
    case "plan":
      return <SubscriptionManager tenantId={tenantId} />;
    case "alertas":
      return <NotificationSettings tenantId={tenantId} />;
    case "general":
    default:
      return <TenantSettings tenantId={tenantId} tenantSlug={tenantSlug} />;
  }
};

export default SettingsSection;
