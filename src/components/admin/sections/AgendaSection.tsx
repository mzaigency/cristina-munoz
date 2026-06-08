import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Sparkles } from "lucide-react";
import { LocalCalendarCRM } from "../LocalCalendarCRM";
import { WaitlistManager } from "../WaitlistManager";
import { AgendaImporter } from "../import/AgendaImporter";
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
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Sheet>
            <SheetTrigger asChild>
              <button className="gp-btn sm" style={{ alignSelf: "flex-start" }}>
                <Sparkles style={{ width: 13, height: 13 }} />
                Importar citas con IA
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[92vh] overflow-y-auto rounded-t-2xl">
              <SheetHeader className="text-left mb-2">
                <SheetTitle>Importar citas</SheetTitle>
              </SheetHeader>
              <AgendaImporter tenantId={tenantId} defaultMode="bookings" />
            </SheetContent>
          </Sheet>
          <LocalCalendarCRM tenantId={tenantId} stylists={stylists} onSelectClient={onSelectClient} />
        </div>
      )}

      {activeTab === "semana" && (
        <div className="gp-card">
          <div className="gp-empty">
            <div className="gp-empty-ic">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><rect x="7" y="14" width="3" height="3" />
              </svg>
            </div>
            <h4>Vista semanal</h4>
            <p>Próximamente: tablero de 7 columnas con todas las citas de la semana. Mientras tanto, usa la vista <strong>Día</strong>.</p>
          </div>
        </div>
      )}

      {activeTab === "espera" && (
        <WaitlistManager tenantId={tenantId} />
      )}
    </div>
  );
};

export default AgendaSection;
