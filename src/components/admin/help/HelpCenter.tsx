import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Sparkles,
  Lock,
  LayoutDashboard,
  Calendar,
  Wallet,
  Users,
  ShoppingBag,
  Megaphone,
  Briefcase,
  Settings,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import type { PlanFeature } from "@/hooks/usePlanLimits";

interface HelpBullet {
  text: string;
  requiredFeature?: PlanFeature;
  requiredPlan?: "pro" | "business";
}

interface HelpSection {
  id: string;
  label: string;
  icon: React.ElementType;
  hint: string;
  bullets: HelpBullet[];
}

const HELP_SECTIONS: HelpSection[] = [
  {
    id: "inicio",
    label: "Inicio",
    icon: LayoutDashboard,
    hint: "Resumen del día, KPIs y checklist inicial",
    bullets: [
      { text: "Métricas en vivo: citas, ingresos, ocupación" },
      { text: "Acciones rápidas: crear cita, cobrar" },
      { text: "Checklist de configuración del salón" },
      { text: "Próximas citas y alertas" },
    ],
  },
  {
    id: "agenda",
    label: "Agenda",
    icon: Calendar,
    hint: "Calendario por día/semana + lista de espera",
    bullets: [
      { text: "Crea citas tocando un hueco vacío" },
      { text: "Arrastra para mover, color por estilista" },
      { text: "Confirmaciones por WhatsApp con 1 toque" },
      { text: "Lista de espera con aviso automático" },
    ],
  },
  {
    id: "caja",
    label: "Caja",
    icon: Wallet,
    hint: "Cobros, pedidos y cierre diario",
    bullets: [
      { text: "Cobra al finalizar cita", requiredFeature: "cash_register", requiredPlan: "pro" },
      { text: "Efectivo, tarjeta o mixto", requiredFeature: "cash_register", requiredPlan: "pro" },
      { text: "Pedidos online de tu tienda" },
      { text: "Cierre diario + Excel", requiredFeature: "cash_register", requiredPlan: "pro" },
    ],
  },
  {
    id: "clientes",
    label: "Clientes",
    icon: Users,
    hint: "CRM, mensajes y notas",
    bullets: [
      { text: "Directorio con historial completo" },
      { text: "Etiquetas VIP automáticas" },
      { text: "Notas privadas por cliente" },
      { text: "Chat en tiempo real", requiredFeature: "messages", requiredPlan: "pro" },
    ],
  },
  {
    id: "catalogo",
    label: "Catálogo",
    icon: ShoppingBag,
    hint: "Servicios, productos y paquetes",
    bullets: [
      { text: "Servicios con precio y duración" },
      { text: "Inventario de productos" },
      { text: "Paquetes con descuento auto", requiredFeature: "packages", requiredPlan: "pro" },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: Megaphone,
    hint: "Posts, QR, promos y reseñas",
    bullets: [
      { text: "Posts de tu portafolio visual" },
      { text: "Tarjetas QR + cartel A4 para imprimir" },
      { text: "Difusión por WhatsApp" },
      { text: "Cupones de descuento", requiredFeature: "promotions", requiredPlan: "pro" },
      { text: "Modera reseñas públicas" },
    ],
  },
  {
    id: "negocio",
    label: "Negocio",
    icon: Briefcase,
    hint: "Equipo, horarios, estadísticas y objetivos",
    bullets: [
      { text: "Estilistas con color propio" },
      { text: "Horarios y pausas" },
      { text: "Comisiones automáticas", requiredFeature: "commissions", requiredPlan: "business" },
      { text: "Estadísticas avanzadas", requiredFeature: "advanced_analytics", requiredPlan: "pro" },
      { text: "Objetivos mensuales", requiredFeature: "monthly_goals", requiredPlan: "business" },
    ],
  },
  {
    id: "ajustes",
    label: "Ajustes",
    icon: Settings,
    hint: "Logo, plan, notificaciones",
    bullets: [
      { text: "Tema, colores y logo del salón" },
      { text: "Plan de suscripción y facturación" },
      { text: "Notificaciones push y email" },
    ],
  },
];

interface HelpCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartTour: () => void;
  hasFeature?: (feature: PlanFeature) => boolean;
}

export function HelpCenter({ open, onOpenChange, onStartTour, hasFeature }: HelpCenterProps) {
  const [query, setQuery] = useState("");
  const isMobile = useIsMobile();

  const filtered = useMemo(() => {
    if (!query.trim()) return HELP_SECTIONS;
    const q = query.toLowerCase();
    return HELP_SECTIONS
      .map((s) => ({
        ...s,
        bullets: s.bullets.filter((b) => b.text.toLowerCase().includes(q)),
      }))
      .filter(
        (s) =>
          s.label.toLowerCase().includes(q) ||
          s.hint.toLowerCase().includes(q) ||
          s.bullets.length > 0,
      );
  }, [query]);

  const Body = (
    <>
      <div className="px-4 pt-3 pb-2 space-y-2 border-b bg-background sticky top-0 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar funciones..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Button
          onClick={() => { onOpenChange(false); onStartTour(); }}
          className="w-full h-9 gap-2 gp-grad-brand"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="text-xs font-semibold">Hacer el tour guiado</span>
        </Button>
      </div>

      <ScrollArea className="max-h-[55vh]">
        <div className="p-3 space-y-2">
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8 text-muted-foreground text-sm"
              >
                <Search className="h-7 w-7 mx-auto mb-2 opacity-40" />
                Sin resultados para "{query}"
              </motion.div>
            ) : (
              filtered.map((section, idx) => {
                const Icon = section.icon;
                return (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.2 }}
                    className="rounded-xl border border-border/60 bg-card hover:border-border transition-colors overflow-hidden"
                  >
                    <div className="flex items-center gap-3 px-3 py-2.5 bg-muted/40">
                      <div className="h-8 w-8 rounded-lg gp-grad-brand-soft flex items-center justify-center gp-text-brand shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold leading-tight">{section.label}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{section.hint}</div>
                      </div>
                    </div>
                    <ul className="px-3 py-2 space-y-1.5">
                      {section.bullets.map((b, i) => {
                        const locked = !!(b.requiredFeature && hasFeature && !hasFeature(b.requiredFeature));
                        return (
                          <li
                            key={i}
                            className={cn(
                              "flex items-center gap-2 text-[12.5px] leading-snug",
                              locked ? "text-muted-foreground/70" : "text-foreground/85",
                            )}
                          >
                            <span
                              className={cn(
                                "w-1 h-1 rounded-full shrink-0",
                                locked ? "bg-muted-foreground/40" : "bg-[color:var(--gp-accent)]",
                              )}
                            />
                            <span className="flex-1">{b.text}</span>
                            {locked && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[var(--gp-warn-soft)] text-[var(--gp-warn-ink)]   uppercase">
                                <Lock className="h-2 w-2" />
                                {b.requiredPlan === "business" ? "Biz" : "Pro"}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[88vh]">
          <DrawerHeader className="border-b pb-2 pt-3">
            <DrawerTitle className="flex items-center gap-2 text-base">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <HelpCircle className="h-4 w-4 text-primary" />
              </div>
              Centro de ayuda
            </DrawerTitle>
          </DrawerHeader>
          {Body}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <HelpCircle className="h-4 w-4 text-primary" />
            </div>
            Centro de ayuda
          </DialogTitle>
        </DialogHeader>
        {Body}
      </DialogContent>
    </Dialog>
  );
}
