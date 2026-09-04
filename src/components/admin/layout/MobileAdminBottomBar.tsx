import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Calendar,
  Wallet,
  UserCircle,
  Briefcase,
  ShoppingBag,
  Users,
  Settings,
  LayoutGrid,
  X,
  Check,
} from "lucide-react";
import { NotifBadge } from "@/components/admin/layout/NotifBadge";
import { cn } from "@/lib/utils";

export type SectionValue =
  | "inicio"
  | "agenda"
  | "caja"
  | "clientes"
  | "equipo"
  | "catalogo"
  | "negocio"
  | "ajustes";

export interface MobileAdminBottomBarProps {
  activeSection: SectionValue;
  onSelectSection: (section: SectionValue) => void;
  notificationCounts: {
    messages: number;
    reviews: number;
    agenda?: number;
  };
  waitlistCount: number;
  unseenOrders: number;
  isStylist?: boolean;
  isAdmin?: boolean;
}

interface NavDef {
  value: SectionValue;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  category: "operativa" | "gestion";
  subtitle: string;
  color: string;
}

export function MobileAdminBottomBar({
  activeSection,
  onSelectSection,
  notificationCounts,
  waitlistCount,
  unseenOrders,
  isStylist = false,
  isAdmin = true,
}: MobileAdminBottomBarProps) {
  const [hubOpen, setHubOpen] = useState(false);

  const allNavDefs: NavDef[] = [
    {
      value: "inicio",
      label: "Inicio",
      icon: Home,
      badge: notificationCounts.agenda,
      category: "operativa",
      subtitle: "Resumen y accesos rápidos",
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      value: "agenda",
      label: "Agenda",
      icon: Calendar,
      badge: waitlistCount,
      category: "operativa",
      subtitle: "Citas y lista de espera",
      color: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    },
    {
      value: "caja",
      label: "Caja",
      icon: Wallet,
      badge: unseenOrders,
      category: "operativa",
      subtitle: "Cobros, tickets y cierres",
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      value: "clientes",
      label: "Clientes",
      icon: UserCircle,
      badge: (notificationCounts.messages || 0) + (notificationCounts.reviews || 0),
      category: "operativa",
      subtitle: "Fichas, historial, mensajes y reseñas",
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    },
    {
      value: "equipo",
      label: "Equipo",
      icon: Users,
      category: "operativa",
      subtitle: "Miembros, turnos y vacaciones",
      color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    },
    {
      value: "catalogo",
      label: "Catálogo",
      icon: ShoppingBag,
      category: "gestion",
      subtitle: "Servicios, productos, bonos y promos",
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    {
      value: "negocio",
      label: "Negocio",
      icon: Briefcase,
      category: "gestion",
      subtitle: "Estadísticas, objetivos, posts y QR",
      color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    },
    {
      value: "ajustes",
      label: "Ajustes",
      icon: Settings,
      category: "gestion",
      subtitle: "Configuración general y perfil",
      color: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
    },
  ];

  const visibleAll = isStylist && !isAdmin
    ? allNavDefs.filter((item) => !["equipo", "negocio", "ajustes"].includes(item.value))
    : allNavDefs;

  // Los 5 indispensables fijos en la barra inferior
  const primaryKeys: SectionValue[] = isStylist && !isAdmin
    ? ["inicio", "agenda", "caja", "clientes"]
    : ["inicio", "agenda", "caja", "clientes", "equipo"];

  const primaryItems = primaryKeys
    .map((k) => visibleAll.find((item) => item.value === k))
    .filter(Boolean) as NavDef[];

  // Si la sección activa es una de las secundarias (Catálogo, Negocio, Ajustes)
  const isExtraActive = !primaryKeys.includes(activeSection);
  const activeExtraItem = isExtraActive ? visibleAll.find((i) => i.value === activeSection) : null;

  const totalExtraBadges = visibleAll
    .filter((i) => !primaryKeys.includes(i.value))
    .reduce((acc, curr) => acc + (curr.badge || 0), 0);

  const handleSelect = (val: SectionValue) => {
    onSelectSection(val);
    setHubOpen(false);
  };

  return (
    <>
      {/* ── Floating iOS Glass Dock (Fixed, no horizontal scroll) ── */}
      <nav
        className="md:hidden fixed bottom-[calc(env(safe-area-inset-bottom,0px)+8px)] left-2 right-2 z-40 select-none pointer-events-auto"
        data-tour-target="mobile-bottom-nav"
        aria-label="Navegación móvil"
      >
        <div className="bg-card/85 dark:bg-card/90 backdrop-blur-2xl border border-border/60 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.22)] rounded-2xl p-1 transition-all">
          <div
            className="grid items-center w-full gap-0.5"
            style={{ gridTemplateColumns: `repeat(${primaryItems.length + 1}, minmax(0, 1fr))` }}
          >
            {/* Los apartados indispensables */}
            {primaryItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activeSection === item.value;
              const badgeCount = typeof item.badge === "number" ? item.badge : 0;
              const showBadge = badgeCount > 0 && !isActive;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => handleSelect(item.value)}
                  data-tour-nav={item.value}
                  className={cn(
                    "relative flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-colors cursor-pointer w-full min-h-[50px]",
                    isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {/* Sliding Animated iOS Spring Pill */}
                  {isActive && (
                    <motion.div
                      layoutId="mobileAdminDockActivePill"
                      className="absolute inset-0 bg-primary/10 dark:bg-primary/20 border border-primary/25 rounded-xl shadow-xs"
                      transition={{ type: "spring", stiffness: 440, damping: 32 }}
                    />
                  )}

                  <span className="relative z-10 flex items-center justify-center">
                    <IconComp className={cn("w-[18px] h-[18px] transition-transform", isActive && "scale-105")} />
                    {showBadge && (
                      <span className="absolute -top-1 -right-2">
                        <NotifBadge count={badgeCount} dot />
                      </span>
                    )}
                  </span>

                  <span
                    className={cn(
                      "relative z-10 text-[10px] tracking-tight mt-1 truncate max-w-full leading-tight",
                      isActive ? "font-bold text-primary" : "font-medium text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}

            {/* Botón Menú (abre el sheet con todas las secciones organizadas) */}
            <button
              type="button"
              onClick={() => setHubOpen(true)}
              data-tour-nav="more"
              className={cn(
                "relative flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-colors cursor-pointer w-full min-h-[50px]",
                isExtraActive || hubOpen ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
              )}
              title="Todas las secciones"
              aria-label="Todas las secciones"
            >
              {isExtraActive && (
                <motion.div
                  layoutId="mobileAdminDockActivePill"
                  className="absolute inset-0 bg-primary/10 dark:bg-primary/20 border border-primary/25 rounded-xl shadow-xs"
                  transition={{ type: "spring", stiffness: 440, damping: 32 }}
                />
              )}

              <span className="relative z-10 flex items-center justify-center">
                <LayoutGrid className={cn("w-[18px] h-[18px] transition-transform", (isExtraActive || hubOpen) && "scale-105")} />
                {totalExtraBadges > 0 && !isExtraActive && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-background" />
                )}
              </span>

              <span
                className={cn(
                  "relative z-10 text-[10px] tracking-tight mt-1 truncate max-w-full leading-tight",
                  isExtraActive || hubOpen ? "font-bold text-primary" : "font-medium text-muted-foreground"
                )}
              >
                {activeExtraItem ? activeExtraItem.label : "Menú"}
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── iOS Spring App Hub Sheet (Todas las secciones organizadas) ── */}
      <AnimatePresence>
        {hubOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop with blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setHubOpen(false)}
            />

            {/* Bottom Sheet Card with Drag gesture & Spring physics */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.y > 80 || info.velocity.y > 400) {
                  setHubOpen(false);
                }
              }}
              className="relative z-10 w-full max-w-lg bg-card border-t border-border/70 rounded-t-[28px] p-5 pb-[calc(env(safe-area-inset-bottom,0px)+24px)] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            >
              {/* iOS Grip Bar */}
              <div className="w-10 h-1.5 bg-muted-foreground/25 rounded-full mx-auto mb-3 cursor-grab shrink-0" />

              {/* Sheet Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border/40 shrink-0">
                <div>
                  <h3 className="text-base font-bold text-foreground tracking-tight m-0">
                    Secciones del panel
                  </h3>
                  <p className="text-xs text-muted-foreground m-0">
                    Accede a cualquier área del salón
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setHubOpen(false)}
                  className="w-8 h-8 rounded-full bg-muted/60 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Grid of Sections */}
              <div className="overflow-y-auto pt-4 space-y-4 no-scrollbar">
                {/* Categoría: Operativa diaria */}
                <div>
                  <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1 mb-2">
                    Operativa y Día a Día
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {visibleAll
                      .filter((i) => i.category === "operativa")
                      .map((item) => {
                        const IconComp = item.icon;
                        const isActive = activeSection === item.value;
                        const badgeCount = typeof item.badge === "number" ? item.badge : 0;

                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => handleSelect(item.value)}
                            className={cn(
                              "flex items-start gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer relative",
                              isActive
                                ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20"
                                : "bg-card hover:bg-muted/40 border-border/60"
                            )}
                          >
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", item.color)}>
                              <IconComp className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className={cn("text-xs font-bold leading-none", isActive ? "text-primary" : "text-foreground")}>
                                  {item.label}
                                </span>
                                {isActive && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                              </div>
                              <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-snug">
                                {item.subtitle}
                              </p>
                            </div>
                            {badgeCount > 0 && !isActive && (
                              <span className="absolute top-2 right-2">
                                <NotifBadge count={badgeCount} />
                              </span>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Categoría: Gestión y Negocio */}
                {visibleAll.some((i) => i.category === "gestion") && (
                  <div>
                    <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1 mb-2">
                      Catálogo, Negocio y Ajustes
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {visibleAll
                        .filter((i) => i.category === "gestion")
                        .map((item) => {
                          const IconComp = item.icon;
                          const isActive = activeSection === item.value;
                          const badgeCount = typeof item.badge === "number" ? item.badge : 0;

                          return (
                            <button
                              key={item.value}
                              type="button"
                              onClick={() => handleSelect(item.value)}
                              className={cn(
                                "flex items-start gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer relative",
                                isActive
                                  ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20"
                                  : "bg-card hover:bg-muted/40 border-border/60"
                              )}
                            >
                              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", item.color)}>
                                <IconComp className="w-5 h-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className={cn("text-xs font-bold leading-none", isActive ? "text-primary" : "text-foreground")}>
                                    {item.label}
                                  </span>
                                  {isActive && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                                </div>
                                <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-snug">
                                  {item.subtitle}
                                </p>
                              </div>
                              {badgeCount > 0 && !isActive && (
                                <span className="absolute top-2 right-2">
                                  <NotifBadge count={badgeCount} />
                                </span>
                              )}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
