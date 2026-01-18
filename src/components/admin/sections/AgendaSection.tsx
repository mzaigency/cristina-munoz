import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { LocalCalendarCRM } from "../LocalCalendarCRM";
import { WaitlistManager } from "../WaitlistManager";
import { supabase } from "@/integrations/supabase/client";

interface AgendaSectionProps {
  tenantId: string;
  onNavigateToCash?: () => void;
}

type AgendaTab = "calendar" | "waitlist";

const AgendaSection = ({ tenantId, onNavigateToCash }: AgendaSectionProps) => {
  const [activeTab, setActiveTab] = useState<AgendaTab>("calendar");
  const [stylists, setStylists] = useState<Array<{ slug: string; name: string; color: string }>>([]);
  const [waitlistCount, setWaitlistCount] = useState(0);

  useEffect(() => {
    const fetchStylists = async () => {
      const { data } = await supabase
        .from("tenant_stylists")
        .select("slug, name, color")
        .eq("tenant_id", tenantId)
        .eq("is_active", true);

      if (data) {
        setStylists(
          data.map((s) => ({
            slug: s.slug,
            name: s.name,
            color: s.color || "#6366f1",
          })),
        );
      }
    };

    fetchStylists();
  }, [tenantId]);

  // Fetch waitlist count
  useEffect(() => {
    const fetchWaitlistCount = async () => {
      const { count } = await supabase
        .from("waitlist")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("status", "waiting");

      setWaitlistCount(count || 0);
    };

    fetchWaitlistCount();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`waitlist-count-${tenantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "waitlist", filter: `tenant_id=eq.${tenantId}` },
        () => fetchWaitlistCount(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId]);

  // Clear badge when viewing waitlist tab
  const handleTabChange = (value: string) => {
    setActiveTab(value as AgendaTab);
  };

  const tabs = [
    { id: "calendar" as AgendaTab, label: "Calendario", icon: Calendar, badge: 0 },
    { id: "waitlist" as AgendaTab, label: "Lista de espera", icon: Clock, badge: waitlistCount },
  ];

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full flex bg-muted/50 p-1 rounded-lg">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex-1 flex items-center justify-center gap-2 text-sm px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm relative"
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.badge > 0 && activeTab !== tab.id && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center text-xs px-1.5"
                >
                  {tab.badge > 99 ? "99+" : tab.badge}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          <LocalCalendarCRM tenantId={tenantId} stylists={stylists} onNavigateToCash={onNavigateToCash} />
        </TabsContent>

        <TabsContent value="waitlist" className="mt-4">
          <WaitlistManager tenantId={tenantId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgendaSection;
