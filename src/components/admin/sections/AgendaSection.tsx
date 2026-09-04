import { useState, useEffect } from "react";
import { STYLIST_FALLBACK } from "@/lib/chartColors";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Sparkles } from "lucide-react";
import { LocalCalendarCRM } from "../LocalCalendarCRM";
import { WaitlistManager } from "../WaitlistManager";
import { AgendaImporter } from "../import/AgendaImporter";
import { QuickBookingSheet } from "../QuickBookingSheet";
import { supabase } from "@/integrations/supabase/client";

interface AgendaSectionProps {
  tenantId: string;
  onSelectClient?: (clientId: string) => void;
  subTab?: string;
}

type AgendaTab = "dia" | "semana" | "espera";

const AgendaSection = ({ tenantId, onSelectClient, subTab }: AgendaSectionProps) => {
  const [internalTab, setInternalTab] = useState<AgendaTab>("dia");
  const activeTab: AgendaTab = (subTab as AgendaTab) || internalTab;
  const [stylists, setStylists] = useState<Array<{ slug: string; name: string; color: string }>>([]);
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
    const asked =
      sessionStorage.getItem("openNewBooking") === "1" ||
      new URLSearchParams(window.location.search).get("action") === "new-booking";
    if (asked) {
      sessionStorage.removeItem("openNewBooking");
      setFabOpen(true);
    }
  }, []);

  useEffect(() => {
    const fetchStylists = async () => {
      const { data } = await supabase
        .from("tenant_stylists")
        .select("slug, name, color")
        .eq("tenant_id", tenantId)
        .eq("is_active", true);
      if (data) {
        setStylists(data.map((s) => ({ slug: s.slug, name: s.name, color: s.color || STYLIST_FALLBACK })));
      }
    };
    fetchStylists();
  }, [tenantId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {activeTab === "dia" && (
        <div data-tour-target="agenda-calendar">
          <LocalCalendarCRM
            tenantId={tenantId}
            stylists={stylists}
            onSelectClient={onSelectClient}
            topLeftSlot={
              <Sheet>
                <SheetTrigger asChild>
                  <button className="glow-btn glow-btn--sm">
                    <Sparkles style={{ width: 13, height: 13 }} />
                    <span className="glow-hide-sm">Importar citas con IA</span>
                    <span className="glow-show-sm">Importar</span>
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
