import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock
} from "lucide-react";
import { LocalCalendarCRM } from "../LocalCalendarCRM";
import { WaitlistManager } from "../WaitlistManager";
import { supabase } from "@/integrations/supabase/client";

interface AgendaSectionProps {
  tenantId: string;
}

type AgendaTab = "calendar" | "waitlist";

const AgendaSection = ({ tenantId }: AgendaSectionProps) => {
  const [activeTab, setActiveTab] = useState<AgendaTab>("calendar");
  const [stylists, setStylists] = useState<Array<{ slug: string; name: string; color: string }>>([]);

  useEffect(() => {
    const fetchStylists = async () => {
      const { data } = await supabase
        .from("tenant_stylists")
        .select("slug, name, color")
        .eq("tenant_id", tenantId)
        .eq("is_active", true);
      
      if (data) {
        setStylists(data.map(s => ({
          slug: s.slug,
          name: s.name,
          color: s.color || "#6366f1"
        })));
      }
    };
    
    fetchStylists();
  }, [tenantId]);

  const tabs = [
    { id: "calendar" as AgendaTab, label: "Calendario", icon: Calendar },
    { id: "waitlist" as AgendaTab, label: "Lista de espera", icon: Clock },
  ];

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AgendaTab)}>
        <TabsList className="w-full flex bg-muted/50 p-1 rounded-lg">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex-1 flex items-center justify-center gap-2 text-sm px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          <LocalCalendarCRM tenantId={tenantId} stylists={stylists} />
        </TabsContent>

        <TabsContent value="waitlist" className="mt-4">
          <WaitlistManager tenantId={tenantId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgendaSection;
