import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Scissors, 
  Percent, 
  Clock
} from "lucide-react";
import { StylistsManager } from "../StylistsManager";
import { ServicesManager } from "../ServicesManager";
import { CommissionsManager } from "../CommissionsManager";
import { BusinessHoursManager } from "../BusinessHoursManager";

interface TeamSectionProps {
  tenantId: string;
}

type TeamTab = "stylists" | "services" | "commissions" | "hours";

const TeamSection = ({ tenantId }: TeamSectionProps) => {
  const [activeTab, setActiveTab] = useState<TeamTab>("stylists");

  const tabs = [
    { id: "stylists" as TeamTab, label: "Equipo", icon: Users },
    { id: "services" as TeamTab, label: "Servicios", icon: Scissors },
    { id: "commissions" as TeamTab, label: "Comisiones", icon: Percent },
    { id: "hours" as TeamTab, label: "Horarios", icon: Clock },
  ];

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TeamTab)}>
        <TabsList className="w-full flex overflow-x-auto no-scrollbar bg-muted/50 p-1 rounded-lg">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex-1 min-w-fit flex items-center gap-1.5 text-xs px-3 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="stylists" className="mt-4">
          <StylistsManager tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="services" className="mt-4">
          <ServicesManager tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="commissions" className="mt-4">
          <CommissionsManager tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="hours" className="mt-4">
          <BusinessHoursManager tenantId={tenantId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamSection;