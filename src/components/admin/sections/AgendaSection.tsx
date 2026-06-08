import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Calendar, CalendarDays, Clock, Sparkles } from "lucide-react";
import { LocalCalendarCRM } from "../LocalCalendarCRM";
import { WaitlistManager } from "../WaitlistManager";
import { AgendaImporter } from "../import/AgendaImporter";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface AgendaSectionProps {
  tenantId: string;
  onSelectClient?: (clientId: string) => void;
  /** Controlled sub-tab from URL: dia | semana | espera */
  subTab?: string;
  onSubTabChange?: (subTab: string) => void;
  hideTabs?: boolean;
}

type AgendaTab = "dia" | "semana" | "espera";

/**
 * Top-level Agenda section. Houses the daily calendar, a weekly view
 * (placeholder for now — reuses the same engine in a future iteration), and
 * the waitlist. Cash & orders have moved to the Caja section.
 */
const AgendaSection = ({ tenantId, onSelectClient, subTab, onSubTabChange, hideTabs }: AgendaSectionProps) => {
  const [internalTab, setInternalTab] = useState<AgendaTab>("dia");
  const activeTab: AgendaTab = (subTab as AgendaTab) || internalTab;
  const setActiveTab = (t: AgendaTab) => {
    if (onSubTabChange) onSubTabChange(t);
    else setInternalTab(t);
  };
  const [stylists, setStylists] = useState<Array<{ slug: string; name: string; color: string }>>([]);
  const [waitlistCount, setWaitlistCount] = useState(0);

  useEffect(() => {
    if (subTab) return;
    const legacySubTab = sessionStorage.getItem("openAgendaSubTab");
    if (legacySubTab) {
      // Old keys → new
      const map: Record<string, AgendaTab> = {
        calendar: "dia",
        dia: "dia",
        semana: "semana",
        waitlist: "espera",
        espera: "espera",
      };
      const next = map[legacySubTab];
      if (next) setInternalTab(next);
      sessionStorage.removeItem("openAgendaSubTab");
    }
  }, [subTab]);

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

  const tabs = [
    { id: "dia" as AgendaTab, label: "Día", icon: Calendar, badge: 0 },
    { id: "semana" as AgendaTab, label: "Semana", icon: CalendarDays, badge: 0 },
    { id: "espera" as AgendaTab, label: "Espera", icon: Clock, badge: waitlistCount },
  ];

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AgendaTab)}>
        {!hideTabs && (
          <TabsList className="w-full flex gp-tabs">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 text-xs sm:text-sm px-2 sm:px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm relative",
                )}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.badge > 0 && activeTab !== tab.id && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center text-xs px-1.5">
                    {tab.badge > 99 ? "99+" : tab.badge}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        )}

        <TabsContent value="dia" className="mt-4 space-y-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="w-full sm:w-auto gap-2 border-dashed border-primary/40 text-primary hover:bg-primary/5">
                <Sparkles className="h-4 w-4" />
                Importar citas desde foto con IA
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[92vh] overflow-y-auto rounded-t-2xl">
              <SheetHeader className="text-left mb-2">
                <SheetTitle>Importar citas</SheetTitle>
              </SheetHeader>
              <AgendaImporter tenantId={tenantId} defaultMode="bookings" />
            </SheetContent>
          </Sheet>
          <LocalCalendarCRM tenantId={tenantId} stylists={stylists} onSelectClient={onSelectClient} />
        </TabsContent>

        <TabsContent value="semana" className="mt-4">
          <div className="rounded-2xl border bg-card p-8 text-center space-y-3">
            <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-bold">Vista semanal</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Próximamente: tablero de 7 columnas con todas las citas de la semana
              de un vistazo. Por ahora, usa la vista <strong>Día</strong> y navega
              entre días desde el calendario.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="espera" className="mt-4">
          <WaitlistManager tenantId={tenantId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgendaSection;
