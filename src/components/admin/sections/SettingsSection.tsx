import { useState } from "react";
import { Bell, Store, CreditCard } from "lucide-react";
import TenantSettings from "../TenantSettings";
import { NotificationSettings } from "../NotificationSettings";
import { SubscriptionManager } from "../SubscriptionManager";

interface SettingsSectionProps {
  tenantId: string;
  tenantSlug: string;
  subTab?: string;
  onSubTabChange?: (subTab: string) => void;
}

type SettingsTab = "general" | "notifications" | "subscription";

const SettingsSection = ({ tenantId, tenantSlug, subTab, onSubTabChange }: SettingsSectionProps) => {
  const [internalTab, setInternalTab] = useState<SettingsTab>("general");
  const activeTab: SettingsTab = (subTab as SettingsTab) || internalTab;
  const setActiveTab = (t: SettingsTab) => {
    if (onSubTabChange) onSubTabChange(t);
    else setInternalTab(t);
  };

  const tabs = [
    { id: "general" as SettingsTab, label: "General", icon: Store },
    { id: "subscription" as SettingsTab, label: "Plan", icon: CreditCard },
    { id: "notifications" as SettingsTab, label: "Alertas", icon: Bell },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div className="gp-subtabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`gp-subtab${activeTab === tab.id ? " on" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon style={{ width: 12, height: 12 }} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "general" && (
        <TenantSettings tenantId={tenantId} tenantSlug={tenantSlug} />
      )}

      {activeTab === "subscription" && (
        <SubscriptionManager tenantId={tenantId} />
      )}

      {activeTab === "notifications" && (
        <NotificationSettings tenantId={tenantId} />
      )}
    </div>
  );
};

export default SettingsSection;
