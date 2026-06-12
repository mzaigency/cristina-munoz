import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HelpCircle, Sparkles, BookOpen, Keyboard } from "lucide-react";
import { AdminTour, tourHasBeenSeen } from "@/components/admin/help/AdminTour";
import { HelpCenter } from "@/components/admin/help/HelpCenter";
import { usePlanLimits } from "@/hooks/usePlanLimits";

interface AdminHelpMenuProps {
  tenantId: string;
  onTourTabChange?: (tab: string, subTab?: string) => void;
}

/**
 * "?" entrypoint — launches SpotlightTour or opens HelpCenter.
 * Auto-launches tour on first visit (localStorage flag).
 */
export function AdminHelpMenu({ tenantId, onTourTabChange }: AdminHelpMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const { hasFeature } = usePlanLimits(tenantId);

  // Auto-launch tour for first-time users
  useEffect(() => {
    if (tourHasBeenSeen()) return;
    const t = setTimeout(() => setTourOpen(true), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full hover:bg-muted/60"
            title="Ayuda"
            aria-label="Abrir menú de ayuda"
          >
            <HelpCircle className="h-[18px] w-[18px]" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 p-2">
          <button
            onClick={() => { setMenuOpen(false); setTourOpen(true); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors text-left"
          >
            <div className="h-8 w-8 rounded-lg gp-grad-brand-soft flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 gp-text-brand" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium">Tour guiado</div>
              <div className="text-[11px] text-muted-foreground">40 segundos · 5 pasos</div>
            </div>
          </button>

          <button
            onClick={() => { setMenuOpen(false); setHelpOpen(true); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors text-left"
          >
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium">Centro de ayuda</div>
              <div className="text-[11px] text-muted-foreground">Buscar funciones</div>
            </div>
          </button>

          <div className="mt-1 px-3 py-2 border-t flex items-center gap-2 text-[11px] text-muted-foreground">
            <Keyboard className="h-3.5 w-3.5" />
            Atajo
            <kbd className="ml-auto px-1.5 py-0.5 rounded bg-muted font-mono text-[10px] font-semibold">⌘K</kbd>
          </div>
        </PopoverContent>
      </Popover>

      <AdminTour
        open={tourOpen}
        onOpenChange={setTourOpen}
        onNavigate={onTourTabChange}
        hasFeature={hasFeature}
      />
      <HelpCenter
        open={helpOpen}
        onOpenChange={setHelpOpen}
        onStartTour={() => setTourOpen(true)}
        hasFeature={hasFeature}
      />
    </>
  );
}
