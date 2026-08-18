import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCircle, MessageCircle } from "lucide-react";
import { ClientsCRM } from "../ClientsCRM";
import { MessagesManager } from "../MessagesManager";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface ClientsSectionProps {
  tenantId: string;
  initialClientId?: string;
  subTab?: string;
  onSubTabChange?: (subTab: string) => void;
  hideTabs?: boolean;
}

type ClientsTab = "directory"|"messages";

/**
 * Clientes section. Reviews moved to Marketing › Reseñas in the new IA;
 * legacy URLs are transparently redirected by TenantAdmin.
 */
const ClientsSection = ({ tenantId, initialClientId, subTab, onSubTabChange, hideTabs }: ClientsSectionProps) => {
  const [internalTab, setInternalTab] = useState<ClientsTab>("directory");
  const slugToId: Record<string, ClientsTab> = { directorio: "directory", mensajes: "messages"}; const idToSlug: Record<ClientsTab, string> = { directory:"directorio", messages: "mensajes" };
  const activeTab: ClientsTab = (subTab && slugToId[subTab]) || internalTab;
  const setActiveTab = (t: ClientsTab) => {
    if (onSubTabChange) onSubTabChange(idToSlug[t]);
    else setInternalTab(t);
  };
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (subTab) return;
    const legacy = sessionStorage.getItem("openClientsSubTab");
    if (legacy && ["directory", "messages"].includes(legacy)) {
      setInternalTab(legacy as ClientsTab);
      sessionStorage.removeItem("openClientsSubTab");
    }
  }, [subTab]);

  useEffect(() => {
    const fetchBadges = async () => {
      const { data } = await supabase
        .from("conversations")
        .select("unread_count_salon")
        .eq("tenant_id", tenantId);
      setUnreadMessages((data || []).reduce((sum, c) => sum + (c.unread_count_salon || 0), 0));
    };
    fetchBadges();
  }, [tenantId]);

  const tabs = [
    { id: "directory"as ClientsTab, label:"Directorio", icon: UserCircle, badge: 0 },
    { id: "messages"as ClientsTab, label:"Mensajes", icon: MessageCircle, badge: unreadMessages },
  ];

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ClientsTab)}>
        {!hideTabs && (
          <TabsList className="w-full flex gp-tabs">
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
                    className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center text-xs px-1.5"> {tab.badge > 99 ?"99+" : tab.badge}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        )}

        <TabsContent value="directory" className="mt-4" data-tour-target="clientes-directorio">
          <ClientsCRM tenantId={tenantId} initialClientId={initialClientId} />
        </TabsContent>

        <TabsContent value="messages" className="mt-4">
          <MessagesManager tenantId={tenantId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientsSection;
