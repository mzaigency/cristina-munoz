import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  Bell, 
  Shield,
  Store,
  CreditCard
} from "lucide-react";
import TenantSettings from "../TenantSettings";
import { NotificationSettings } from "../NotificationSettings";
import { SecurityMonitor } from "../SecurityMonitor";
import { SubscriptionManager } from "../SubscriptionManager";

interface SettingsSectionProps {
  tenantId: string;
  tenantSlug: string;
}

type SettingsTab = "general" | "notifications" | "security" | "subscription";

const SettingsSection = ({ tenantId, tenantSlug }: SettingsSectionProps) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  const tabs = [
    { id: "general" as SettingsTab, label: "General", icon: Store },
    { id: "subscription" as SettingsTab, label: "Plan", icon: CreditCard },
    { id: "notifications" as SettingsTab, label: "Alertas", icon: Bell },
    { id: "security" as SettingsTab, label: "Seguridad", icon: Shield },
  ];

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SettingsTab)}>
        <TabsList className="w-full flex overflow-x-auto no-scrollbar bg-muted/50 p-1 rounded-lg">
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

        <TabsContent value="security" className="mt-4">
          <SecurityMonitor tenantId={tenantId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsSection;
