import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Sparkles, Plus } from "lucide-react";
import { LocalCalendarCRM } from "../LocalCalendarCRM";
import { WaitlistManager } from "../WaitlistManager";
import { AgendaImporter } from "../import/AgendaImporter";
import { QuickBookingSheet } from "../QuickBookingSheet";
import { supabase } from "@/integrations/supabase/client";

interface AgendaSectionProps {
  tenantId: string;
  onSelectClient?: (clientId: string) => void;
  subTab?: string;
  onSubTabChange?: (subTab: string) => void;
  hideTabs?: boolean;
}

type AgendaTab = "dia" | "semana" | "espera";

const AgendaSection = ({ tenantId, onSelectClient, subTab, onSubTabChange, hideTabs }: AgendaSectionProps) => {
  const [internalTab, setInternalTab] = useState<AgendaTab>("dia");
  const activeTab: AgendaTab = (subTab as AgendaTab) || internalTab;
  const setActiveTab = (t: AgendaTab) => {
    if (onSubTabChange) onSubTabChange(t);
    else setInternalTab(t);
  };
  const [stylists, setStylists] = useState<Array<{ slug: string; name: string; color: string }>>([]);
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [fabOpen, setFabOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const nextQuarterSlot = () => {
    const d = new Date();
    const m = d.getMinutes();
    const add = 15 - (m % 15 || 15);
    d.setMinutes(m + add, 0, 0);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  useEffect(() => {
    if (subTab) return;
    const legacySubTab = sessionStorage.getItem("openAgendaSubTab");
    if (legacySubTab) {
      const map: Record<string, AgendaTab> = {
        calendar: "dia", dia: "dia", semana: "semana",
        waitlist: "espera", espera: "espera",
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {!hideTabs && (
        <div className="gp-subtabs">
          <button className={`gp-subtab${activeTab === "dia" ? " on" : ""}`} onClick={() => setActiveTab("dia")}>
            Día
          </button>
          <button className={`gp-subtab${activeTab === "semana" ? " on" : ""}`} onClick={() => setActiveTab("semana")}>
            Semana
          </button>
          <button className={`gp-subtab${activeTab === "espera" ? " on" : ""}`} onClick={() => setActiveTab("espera")}>
            Lista de espera
            {waitlistCount > 0 && <span className="gp-subtab-count">{waitlistCount}</span>}
          </button>
        </div>
      )}

      {activeTab === "dia" && (
        <div data-tour-target="agenda-calendar">
          <LocalCalendarCRM
            tenantId={tenantId}
            stylists={stylists}
            onSelectClient={onSelectClient}
            topLeftSlot={
              <Sheet>
                <SheetTrigger asChild>
                  <button className="gp-btn sm">
                    <Sparkles style={{ width: 13, height: 13 }} />
                    <span className="gp-hide-sm">Importar citas con IA</span>
                    <span className="gp-show-sm">Importar</span>
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[92vh] overflow-y-auto rounded-t-2xl">
                  <SheetHeader className="text-left mb-2">
                    <SheetTitle>Importar citas</SheetTitle>
                  </SheetHeader>
                  <AgendaImporter tenantId={tenantId} defaultMode="bookings" />
                </SheetContent>
              </Sheet>
            }
          />
        </div>
      )}

      {activeTab === "semana" && (
        <LocalCalendarCRM
          view="semana"
          tenantId={tenantId}
          stylists={stylists}
          onSelectClient={onSelectClient}
        />
      )}

      {activeTab === "espera" && (
        <WaitlistManager tenantId={tenantId} />
      )}

      {/* FAB "Nueva cita" — solo móvil, solo en Día */}
      {activeTab === "dia" && (
        <button
          onClick={() => setFabOpen(true)}
          aria-label="Nueva cita"
          className="md:hidden fixed z-40 flex items-center justify-center rounded-full text-white shadow-lg active:scale-95 transition-transform"
          style={{
            right: "calc(1rem + env(safe-area-inset-right))",
            bottom: "calc(5rem + env(safe-area-inset-bottom))",
            width: 56,
            height: 56,
            background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
            boxShadow: "0 8px 24px -6px hsl(var(--primary) / 0.45)",
          }}
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>
      )}

      <QuickBookingSheet
        key={refreshKey}
        open={fabOpen}
        onOpenChange={setFabOpen}
        tenantId={tenantId}
        initialDate={new Date()}
        initialTime={nextQuarterSlot()}
        initialStylistSlug={stylists[0]?.slug || "any"}
        stylists={stylists}
        onCreated={() => {
          setFabOpen(false);
          setRefreshKey((k) => k + 1);
        }}
      />
    </div>
  );
};

export default AgendaSection;
