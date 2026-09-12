import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import {
  LayoutDashboard,
  Activity,
  ShieldAlert,
  Building2,
  TrendingUp,
  UserCheck,
  Users,
  Image,
  Star,
  CreditCard,
  Receipt,
  Terminal,
  Wand2,
  ChevronDown,
  Search,
  Plus,
  Moon,
  Sun,
  Crown,
  ArrowLeft,
  LogOut,
  Menu,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import glowappWordmark from "@/assets/glowapp-wordmark.png";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface NavGroup {
  id: string;
  label: string;
  icon: any;
  hasSubnav: boolean;
  subtabs: {
    id: string;
    label: string;
    icon: any;
    badgeCount?: number;
  }[];
}

export const SUPERADMIN_NAV_GROUPS: NavGroup[] = [
  {
    id: "command",
    label: "Centro de Mando",
    icon: LayoutDashboard,
    hasSubnav: true,
    subtabs: [
      { id: "kpis", label: "Visión Global", icon: LayoutDashboard },
      { id: "pulse", label: "Live Pulse", icon: Activity },
      { id: "maintenance", label: "Mantenimiento & Anuncio", icon: ShieldAlert },
    ],
  },
  {
    id: "tenants",
    label: "Ecosistema Salones",
    icon: Building2,
    hasSubnav: true,
    subtabs: [
      { id: "directory", label: "Directorio 360°", icon: Building2 },
      { id: "b2b_leads", label: "Leads B2B & CRM", icon: TrendingUp },
      { id: "onboarding", label: "Embudo Onboarding", icon: UserCheck },
    ],
  },
  {
    id: "community",
    label: "Comunidad & Moderación",
    icon: Users,
    hasSubnav: true,
    subtabs: [
      { id: "users", label: "Usuarios & Roles", icon: Users },
      { id: "feed_moderation", label: "Moderación de Feed", icon: Image },
      { id: "reviews", label: "Reseñas & Disputas", icon: Star },
    ],
  },
  {
    id: "system",
    label: "Monetización & Sistema",
    icon: CreditCard,
    hasSubnav: true,
    subtabs: [
      { id: "plans", label: "Planes y Comisiones", icon: CreditCard },
      { id: "transactions", label: "Facturación & Pagos", icon: Receipt },
      { id: "logs", label: "Salud del Sistema & Logs", icon: Terminal },
      { id: "sandbox", label: "Fábrica de Demos", icon: Wand2 },
    ],
  },
];

interface SuperAdminLayoutProps {
  activeTab: string;
  activeSubtab: string;
  onTabChange: (tab: string, subtab: string) => void;
  onOpenCommandPalette: () => void;
  onOpenNewTenantModal: () => void;
  systemHealthy?: boolean;
  children: React.ReactNode;
}

export const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({
  activeTab,
  activeSubtab,
  onTabChange,
  onOpenCommandPalette,
  onOpenNewTenantModal,
  systemHealthy = true,
  children,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark(!isDark);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const activeGroup = SUPERADMIN_NAV_GROUPS.find((g) => g.id === activeTab);
  const activeSubtabObj = activeGroup?.subtabs.find((s) => s.id === activeSubtab);

  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex flex-col h-full bg-[var(--glow-surface)] border-r border-[var(--glow-line)] select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-[var(--glow-line)]/80 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <img
            src={glowappWordmark}
            alt="Glowapp"
            className="h-7 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
          />
        </Link>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-[10px] font-extrabold text-amber-600 dark:text-amber-400">
          <Crown className="w-3 h-3 text-amber-500" />
          <span>SUPERADMIN</span>
        </div>
      </div>

      {/* Navigation List */}
      <div className="glow-nav flex-1 overflow-y-auto p-3 space-y-1">
        <LayoutGroup id="superadmin-sidebar-nav">
          {SUPERADMIN_NAV_GROUPS.map((group) => {
            const isGroupActive = activeTab === group.id;
            const GroupIcon = group.icon;

            return (
              <div key={group.id} className="relative mb-0.5">
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab !== group.id) {
                      onTabChange(group.id, group.subtabs[0].id);
                    }
                  }}
                  className={cn(
                    "glow-navitem group relative w-full text-left cursor-pointer",
                    isGroupActive && "on",
                  )}
                >
                  {isGroupActive && (
                    <motion.div
                      layoutId="superadminActiveGroupPill"
                      className="absolute inset-0 bg-[var(--glow-brand-soft)] border border-[var(--glow-brand-softer)]/80 rounded-[11px] -z-10 shadow-[0_2px_12px_-4px_color-mix(in_oklab,var(--glow-brand)_18%,transparent)]"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  )}

                  <span className="glow-navitem-ic relative z-10 transition-transform duration-200 group-hover:scale-110">
                    <GroupIcon className="h-4 w-4" />
                  </span>

                  <span className="relative z-10 font-bold text-xs truncate">
                    {group.label}
                  </span>

                  {group.hasSubnav && (
                    <motion.div
                      animate={{ rotate: isGroupActive ? 0 : -90 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="ml-auto shrink-0 flex items-center justify-center relative z-10"
                    >
                      <ChevronDown className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                  )}
                </button>

                {/* Subnav desplegable */}
                <AnimatePresence initial={false}>
                  {isGroupActive && group.subtabs.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className="glow-side-subnav overflow-hidden"
                    >
                      {group.subtabs.map((sub) => {
                        const isSubActive = activeSubtab === sub.id;
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => {
                              onTabChange(group.id, sub.id);
                              onNavigate?.();
                            }}
                            className={cn(
                              "glow-subitem relative w-full text-left cursor-pointer",
                              isSubActive && "on",
                            )}
                          >
                            <span
                              className={cn(
                                "glow-subdot transition-all duration-200",
                                isSubActive && "bg-[var(--glow-brand)] scale-125",
                              )}
                            />
                            <span className="relative z-10 truncate text-xs">
                              {sub.label}
                            </span>
                            {typeof sub.badgeCount === "number" && sub.badgeCount > 0 && (
                              <span className="ml-auto px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-rose-500 text-white">
                                {sub.badgeCount}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </LayoutGroup>
      </div>

      {/* Footer / User Controls */}
      <div className="p-3 border-t border-[var(--glow-line)] flex flex-col gap-2 bg-[var(--glow-surface)]">
        <Link
          to="/"
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-black/5 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Volver a la App</span>
        </Link>

        {user && (
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl border border-[var(--glow-line)] bg-card shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-600 flex items-center justify-center shrink-0 font-bold text-xs">
                <Crown className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold truncate text-foreground">
                  {user.email?.split("@")[0]}
                </span>
                <span className="text-[9.5px] text-amber-600 font-semibold leading-tight">
                  Superadmin
                </span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="h-7 w-7 rounded-lg text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
              title="Cerrar Sesión"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--glow-surface-alt,theme(colors.slate.50/50))] flex flex-col font-sans">
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 shrink-0 fixed top-0 bottom-0 left-0 z-30">
          <SidebarContent />
        </aside>

        {/* Mobile Drawer */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-72 bg-card border-r border-[var(--glow-line)]">
            <SidebarContent onNavigate={() => setMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 md:pl-64 overflow-hidden">
          {/* Top Command Header */}
          <header className="h-14 shrink-0 border-b border-[var(--glow-line)] bg-card/80 backdrop-blur-xl px-4 md:px-6 flex items-center justify-between gap-3 z-20">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden h-8 w-8 rounded-lg"
              >
                <Menu className="h-4 w-4" />
              </Button>

              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                <span className="font-semibold text-foreground">
                  {activeGroup?.label || "SuperAdmin"}
                </span>
                <span>/</span>
                <span className="text-[var(--glow-brand)] font-bold truncate">
                  {activeSubtabObj?.label || "Sección"}
                </span>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2">
              {/* Cmd+K Search Trigger */}
              <button
                type="button"
                onClick={onOpenCommandPalette}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--glow-line)] bg-background/80 hover:border-[var(--glow-brand-softer)] text-xs text-muted-foreground hover:text-foreground transition-all shadow-2xs"
              >
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">Buscar...</span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold bg-muted text-muted-foreground rounded border">
                  ⌘K
                </kbd>
              </button>

              {/* Live Status Pill */}
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Sistema Operativo</span>
              </div>

              {/* + Nuevo Salón */}
              <Button
                size="sm"
                onClick={onOpenNewTenantModal}
                className="h-8 gap-1.5 px-3 rounded-xl bg-gradient-to-r from-[var(--glow-brand)] to-[#98329A] text-white hover:brightness-105 shadow-sm text-xs font-bold"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Nuevo Salón</span>
              </Button>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-8 w-8 rounded-xl hover:bg-black/5 dark:hover:bg-white/5"
                title="Cambiar tema"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </header>

          {/* Main Scrollable View */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20">
            <div className="max-w-7xl mx-auto space-y-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
