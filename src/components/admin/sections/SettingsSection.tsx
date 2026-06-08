import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SettingsTab)}>
        <TabsList className="w-full flex overflow-x-auto no-scrollbar gp-tabs">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex-1 min-w-fit flex items-center gap-1.5 text-xs px-3 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <TenantSettings tenantId={tenantId} tenantSlug={tenantSlug} />
        </TabsContent>

        <TabsContent value="subscription" className="mt-4">
          <SubscriptionManager tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <NotificationSettings tenantId={tenantId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsSection;
