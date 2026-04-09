import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Wallet, Lock } from "lucide-react";
import { LocalCalendarCRM } from "../LocalCalendarCRM";
import { WaitlistManager } from "../WaitlistManager";
import { CashRegisterManager } from "../CashRegisterManager";
import { LockedFeature } from "../LockedFeature";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface AgendaSectionProps {
  tenantId: string;
  onSelectClient?: (clientId: string) => void;
}

type AgendaTab = "calendar" | "waitlist" | "cash";

const AgendaSection = ({ tenantId, onSelectClient }: AgendaSectionProps) => {
  const [activeTab, setActiveTab] = useState<AgendaTab>("calendar");
  const [stylists, setStylists] = useState<Array<{ slug: string; name: string; color: string }>>([]);
  const [waitlistCount, setWaitlistCount] = useState(0);
  const { hasFeature, planSlug } = usePlanLimits(tenantId);

  useEffect(() => {
    const openCashTab = sessionStorage.getItem("openCashTab");
    const pendingBooking = sessionStorage.getItem("pendingChargeBooking");
    if ((openCashTab || pendingBooking) && hasFeature("cash_register")) {
      setActiveTab("cash");
      sessionStorage.removeItem("openCashTab");
    }
  }, [hasFeature]);

  useEffect(() => {
    const fetchStylists = async () => {
      const { data } = await supabase
        .from("tenant_stylists")
        .select("slug, name, color")
        .eq("tenant_id", tenantId)
        .eq("is_active", true);

      if (data) {
        setStylists(data.map((s) => ({ slug: s.slug, name: s.name, color: s.color || "#6366f1" })));
      }
    };
    fetchStylists();
  }, [tenantId]);

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

    const channel = supabase
      .channel(`waitlist-count-${tenantId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "waitlist", filter: `tenant_id=eq.${tenantId}` }, () => fetchWaitlistCount())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tenantId]);

  const cashLocked = !hasFeature("cash_register");

  const handleTabChange = (value: string) => {
    if (value === "cash" && cashLocked) return;
    setActiveTab(value as AgendaTab);
  };

  const tabs = [
    { id: "calendar" as AgendaTab, label: "Calendario", icon: Calendar, badge: 0, locked: false },
    { id: "waitlist" as AgendaTab, label: "Espera", icon: Clock, badge: waitlistCount, locked: false },
    { id: "cash" as AgendaTab, label: "Caja", icon: Wallet, badge: 0, locked: cashLocked },
  ];

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full flex bg-muted/50 p-1 rounded-lg">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              disabled={tab.locked}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 text-sm px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm relative",
                tab.locked && "opacity-50 cursor-not-allowed"
              )}
            >
              {tab.locked ? <Lock className="h-4 w-4" /> : <tab.icon className="h-4 w-4" />}
              <span>{tab.label}</span>
              {tab.badge > 0 && activeTab !== tab.id && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center text-xs px-1.5">
                  {tab.badge > 99 ? "99+" : tab.badge}
                </Badge>
              )}
              {tab.locked && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 ml-0.5">Pro</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          <LocalCalendarCRM tenantId={tenantId} stylists={stylists} onSelectClient={onSelectClient} />
        </TabsContent>

        <TabsContent value="waitlist" className="mt-4">
          <WaitlistManager tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="cash" className="mt-4">
          {cashLocked ? (
            <LockedFeature featureName="Caja Registradora" currentPlan={planSlug} requiredPlan="pro" tenantId={tenantId} variant="inline" />
          ) : (
            <CashRegisterManager tenantId={tenantId} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgendaSection;
