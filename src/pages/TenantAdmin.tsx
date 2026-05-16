import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  LogOut,
  Loader2,
  Home,
  ExternalLink,
  Scissors,
  Users,
  Menu,
  ShoppingBag,
  Megaphone,
  UserCircle,
  Sparkles,
  Briefcase,
} from "lucide-react";
import { HelpTutorial } from "@/components/admin/HelpTutorial";
import { InteractiveTour } from "@/components/admin/InteractiveTour";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { useTenantAccess } from "@/hooks/useTenantAccess";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { SubscriptionExpiredScreen } from "@/components/admin/SubscriptionExpiredScreen";
import { NotifBadge } from "@/components/admin/layout/NotifBadge";
import { AdminAccountMenu } from "@/components/admin/layout/AdminAccountMenu";
import { AdminCommandPalette } from "@/components/admin/layout/AdminCommandPalette";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

import {
  ClientsSection,
  CatalogSection,
  MarketingSection,
  InicioSection,
  NegocioSection,
} from "@/components/admin/sections";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
}

type SectionValue = "inicio" | "clientes" | "catalogo" | "marketing" | "negocio";

interface NavItem {
  value: SectionValue;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const VALID_SECTIONS: SectionValue[] = ["inicio", "clientes", "catalogo", "marketing", "negocio"];

// Map legacy dashboard/tour navigation keys → new (section, subTab) URL slugs
const LEGACY_NAV_MAP: Record<string, { section: SectionValue; subTab?: string }> = {
  dashboard: { section: "inicio", subTab: "resumen" },
  calendar: { section: "inicio", subTab: "agenda" },
  agenda: { section: "inicio", subTab: "agenda" },
  cash: { section: "inicio", subTab: "caja" },
  waitlist: { section: "inicio", subTab: "espera" },
  orders: { section: "inicio", subTab: "pedidos" },
  clients: { section: "clientes", subTab: "directorio" },
  directory: { section: "clientes", subTab: "directorio" },
  messages: { section: "clientes", subTab: "mensajes" },
  reviews: { section: "clientes", subTab: "resenas" },
  services: { section: "catalogo", subTab: "services" },
  products: { section: "catalogo", subTab: "products" },
  packages: { section: "catalogo", subTab: "packages" },
  promos: { section: "catalogo", subTab: "promos" },
  catalog: { section: "catalogo" },
  marketing: { section: "marketing" },
  posts: { section: "marketing", subTab: "posts" },
  qr: { section: "marketing", subTab: "qr" },
  whatsapp: { section: "marketing", subTab: "whatsapp" },
  team: { section: "negocio", subTab: "equipo" },
  stylists: { section: "negocio", subTab: "equipo" },
  hours: { section: "negocio", subTab: "equipo" },
  reports: { section: "negocio", subTab: "informes" },
  stats: { section: "negocio", subTab: "informes" },
  goals: { section: "negocio", subTab: "informes" },
  settings: { section: "negocio", subTab: "ajustes" },
};

export default function TenantAdmin() {
  const [userEmail, setUserEmail] = useState("");
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useNavigate();
  const { adminSlug: slug, section: sectionParam, subTab: subTabParam } =
    useParams<{ adminSlug: string; section?: string; subTab?: string }>();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const { isAdmin, isStylist, hasAccess, loading: accessLoading } = useTenantAccess(tenant?.id);
  const { isExpired: subscriptionExpired, plan: subscriptionPlan, loading: subscriptionLoading } =
    useSubscriptionStatus(tenant?.id);

  const {
    counts: notificationCounts,
    refetch: refetchNotifications,
    markSectionViewed,
  } = useAdminNotifications(tenant?.id || null);

  // Resolve active section from URL (default = inicio)
  const activeSection: SectionValue = useMemo(() => {
    if (sectionParam && VALID_SECTIONS.includes(sectionParam as SectionValue)) {
      return sectionParam as SectionValue;
    }
    return "inicio";
  }, [sectionParam]);

  const navItems: NavItem[] = useMemo(() => {
    const clientsBadge = notificationCounts.messages + notificationCounts.reviews;
    const allItems: NavItem[] = [
      { value: "inicio", label: "Inicio", icon: <Home className="h-4 w-4" />, badge: notificationCounts.agenda },
      { value: "clientes", label: "Clientes", icon: <UserCircle className="h-4 w-4" />, badge: clientsBadge },
      { value: "catalogo", label: "Catálogo", icon: <ShoppingBag className="h-4 w-4" /> },
      { value: "marketing", label: "Marketing", icon: <Megaphone className="h-4 w-4" /> },
      { value: "negocio", label: "Negocio", icon: <Briefcase className="h-4 w-4" /> },
    ];
    if (isStylist && !isAdmin) {
      return allItems.filter((item) => !["marketing", "negocio"].includes(item.value));
    }
    return allItems;
  }, [notificationCounts, isAdmin, isStylist]);

  const tabOrder = navItems.map((item) => item.value);

  const goToSection = useCallback(
    (section: SectionValue, subTab?: string) => {
      if (!slug) return;
      const path = subTab ? `/admin/${slug}/${section}/${subTab}` : `/admin/${slug}/${section}`;
      navigate(path);
    },
    [navigate, slug],
  );

  const { handlers: swipeHandlers } = useSwipeNavigation({
    tabs: tabOrder,
    currentTab: activeSection,
    onTabChange: (tab) => goToSection(tab as SectionValue),
    enabled: isMobile,
  });

  // Normalize URL: if user lands on /admin/:slug without section, push to /inicio
  useEffect(() => {
    if (!slug) return;
    if (!sectionParam) {
      navigate(`/admin/${slug}/inicio`, { replace: true });
    } else if (!VALID_SECTIONS.includes(sectionParam as SectionValue)) {
      navigate(`/admin/${slug}/inicio`, { replace: true });
    }
  }, [slug, sectionParam, navigate]);

  useEffect(() => {
    if (!slug) {
      navigate("/");
      return;
    }

    const fetchTenant = async () => {
      setTenantLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserEmail(session.user.email || "");

      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (tenantError || !tenantData) {
        toast({ title: "Error", description: "No se encontró el salón", variant: "destructive" });
        navigate("/");
        return;
      }

      setTenant(tenantData);
      setTenantLoading(false);
    };

    fetchTenant();
  }, [slug]);

  useEffect(() => {
    if (!tenantLoading && !accessLoading && tenant && !hasAccess) {
      toast({ title: "Acceso denegado", description: "No tienes permisos para acceder a este panel", variant: "destructive" });
      navigate("/");
    }
  }, [tenantLoading, accessLoading, hasAccess, tenant]);

  // Mark section as viewed when navigating
  useEffect(() => {
    if (!tenant?.id) return;
    if (activeSection === "clientes") markSectionViewed("clients");
    else if (activeSection === "inicio") markSectionViewed("agenda");
    else markSectionViewed(activeSection as any);
  }, [activeSection, tenant?.id]);

  const handleSignOut = async () => {
    try { await supabase.auth.signOut({ scope: "local" }); } catch (error) { console.error("Error during sign out:", error); }
    try { localStorage.removeItem("supabase.auth.token"); } catch (e) { console.error("Error clearing localStorage:", e); }
    navigate("/auth", { replace: true });
  };

  const handleRefresh = useCallback(async () => {
    setRefreshKey((prev) => prev + 1);
    if (tenant?.id) await refetchNotifications();
    toast({ title: "Actualizado", description: "Datos actualizados correctamente" });
  }, [tenant?.id, refetchNotifications]);

  // Legacy navigate adapter used by AdminDashboard/InteractiveTour
  const handleNavigate = useCallback(
    (tab: string, subTab?: string) => {
      const mapped = LEGACY_NAV_MAP[tab];
      if (mapped) {
        goToSection(mapped.section, subTab || mapped.subTab);
      } else if (VALID_SECTIONS.includes(tab as SectionValue)) {
        goToSection(tab as SectionValue, subTab);
      }
    },
    [goToSection],
  );

  // Absolute-path navigate used by composite sections (InicioSection)
  const handlePathNavigate = useCallback(
    (path: string) => {
      navigate(path);
    },
    [navigate],
  );

  const renderContent = () => {
    if (!tenant) return null;

    switch (activeSection) {
      case "inicio":
        return (
          <InicioSection
            key={refreshKey}
            tenantId={tenant.id}
            tenantSlug={slug || ""}
            subTab={subTabParam}
            onNavigate={(path) => {
              // path may be a legacy tab key or absolute path
              if (path.startsWith("/")) handlePathNavigate(path);
              else handleNavigate(path);
            }}
            onSelectClient={() => goToSection("clientes", "directorio")}
          />
        );
      case "clientes":
        return (
          <ClientsSection
            key={refreshKey}
            tenantId={tenant.id}
            subTab={subTabParam}
            onSubTabChange={(t) => goToSection("clientes", t)}
          />
        );
      case "catalogo":
        return (
          <CatalogSection
            key={refreshKey}
            tenantId={tenant.id}
            subTab={subTabParam}
            onSubTabChange={(t) => goToSection("catalogo", t)}
          />
        );
      case "marketing":
        return (
          <MarketingSection
            key={refreshKey}
            tenantId={tenant.id}
            tenantSlug={tenant.slug}
            subTab={subTabParam}
            onSubTabChange={(t) => goToSection("marketing", t)}
          />
        );
      case "negocio":
        return (
          <NegocioSection
            key={refreshKey}
            tenantId={tenant.id}
            tenantSlug={tenant.slug}
            subTab={subTabParam}
          />
        );
      default:
        return null;
    }
  };

  const handleTabClick = (section: SectionValue) => {
    goToSection(section);
    if (isMobile) setSidebarOpen(false);
  };

  const renderNavButton = (item: NavItem) => {
    const isActive = activeSection === item.value;
    const badgeCount = typeof item.badge === "number" ? item.badge : 0;
    const showBadge = badgeCount > 0 && !isActive;

    return (
      <button
        key={item.value}
        onClick={() => handleTabClick(item.value)}
        role="tab"
        aria-selected={isActive}
        aria-label={`${item.label}${showBadge ? `, ${badgeCount} pendientes` : ""}`}
        data-tour-step={`nav-${item.value}`}
        className={cn(
          "relative flex flex-col items-center justify-center gap-1 transition-all duration-200 shrink-0",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isMobile
            ? [
                "px-2 py-1.5 rounded-xl min-w-[48px] h-[56px]",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg scale-105"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              ]
            : [
                "px-4 py-2.5 rounded-xl min-w-[80px] h-[60px]",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
              ],
        )}
      >
        <div className="relative">
          {item.icon}
          {showBadge && <NotifBadge count={badgeCount} dot />}
        </div>
        <span className={cn("font-medium leading-none whitespace-nowrap", isMobile ? "text-[10px]" : "text-xs")}>
          {item.label}
        </span>
      </button>
    );
  };

  const loading = tenantLoading || accessLoading;

  if (loading || subscriptionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess || !tenant) return null;

  if (subscriptionExpired) {
    return (
      <SubscriptionExpiredScreen
        tenantId={tenant.id}
        tenantName={tenant.name}
        currentPlan={subscriptionPlan || "starter"}
      />
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Liquid Glass ambient background */}
      <div className="fixed inset-0 -z-10 bg-background">
        <div className="absolute inset-0 opacity-40 dark:opacity-20">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/15 blur-[100px] animate-[float_20s_ease-in-out_infinite]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-secondary/20 blur-[100px] animate-[float_25s_ease-in-out_infinite_reverse]" />
          <div className="absolute top-[40%] left-[50%] w-[35%] h-[35%] rounded-full bg-accent/15 blur-[80px] animate-[float_18s_ease-in-out_infinite_2s]" />
        </div>
      </div>

      {/* Mobile Sidebar */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-[280px] p-0 flex flex-col [&>button]:hidden">
            <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ paddingTop: "calc(env(safe-area-inset-top) + 20px)" }}>
              {tenant.logo_url ? (
                <img src={tenant.logo_url} alt={tenant.name} className="h-10 w-10 rounded-xl object-cover ring-2 ring-primary/20 shrink-0" />
              ) : (
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Scissors className="h-5 w-5 text-primary" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-bold text-foreground truncate">{tenant.name}</h2>
                  {subscriptionPlan && (
                    <Badge
                      variant="secondary"
                      className="h-4 px-1.5 text-[9px] font-semibold uppercase tracking-wide bg-gradient-to-r from-primary/15 to-purple-500/15 text-primary border-0 shrink-0"
                    >
                      {subscriptionPlan}
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground truncate">{userEmail}</p>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {navItems.map((item) => {
                const isActive = activeSection === item.value;
                const badgeCount = typeof item.badge === "number" ? item.badge : 0;
                const showBadge = badgeCount > 0 && !isActive;

                return (
                  <button
                    key={item.value}
                    onClick={() => handleTabClick(item.value)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {item.icon}
                    <span className="flex-1 text-left">{item.label}</span>
                    {showBadge && <NotifBadge count={badgeCount} position="inline" />}
                  </button>
                );
              })}
            </nav>

            <div className="border-t px-3 py-4 space-y-1" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}>
              <button
                onClick={() => { setSidebarOpen(false); navigate(`/${slug}`); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Ver web</span>
              </button>
              <button
                onClick={() => { setSidebarOpen(false); navigate("/"); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              >
                <Home className="h-4 w-4" />
                <span>Inicio</span>
              </button>
              <button
                onClick={() => { setSidebarOpen(false); handleSignOut(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all"
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Header */}
      <header
        className="sticky top-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border/40 shadow-sm"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto max-w-7xl px-3 sm:px-4">
          {isMobile ? (
            <div className="flex items-center justify-between py-2.5">
              <Button onClick={() => setSidebarOpen(true)} variant="ghost" size="icon" className="h-9 w-9 shrink-0" aria-label="Abrir menú">
                <Menu className="h-5 w-5" />
              </Button>

              <div className="flex items-center gap-2 min-w-0 flex-1 justify-center">
                {tenant.logo_url ? (
                  <img src={tenant.logo_url} alt={tenant.name} className="h-8 w-8 rounded-lg object-cover ring-2 ring-primary/20 shrink-0" />
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Scissors className="h-4 w-4 text-primary" />
                  </div>
                )}
                <h1 className="text-sm font-bold text-foreground truncate">{tenant.name}</h1>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <InteractiveTour onTabChange={(tab) => handleNavigate(tab)} />
                <HelpTutorial />
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between py-3 border-b border-border/50">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {tenant.logo_url ? (
                    <img src={tenant.logo_url} alt={tenant.name} className="h-10 w-10 rounded-xl object-cover ring-2 ring-primary/20 shrink-0" />
                  ) : (
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Scissors className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h1 className="text-base md:text-lg font-bold text-foreground truncate">{tenant.name}</h1>
                    <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <InteractiveTour onTabChange={(tab) => handleNavigate(tab)} />
                  <HelpTutorial />
                  <div className="w-px h-6 bg-border/60 mx-1" aria-hidden />
                  <AdminAccountMenu
                    tenantName={tenant.name}
                    tenantSlug={tenant.slug}
                    logoUrl={tenant.logo_url}
                    userEmail={userEmail}
                    plan={subscriptionPlan}
                    onViewWeb={() => navigate(`/${slug}`)}
                    onGoHome={() => navigate("/")}
                    onSignOut={handleSignOut}
                  />
                </div>
              </div>

              <nav className="flex items-center py-2" role="tablist">
                <ScrollArea className="w-full">
                  <div className="flex items-center gap-2 pb-2">{navItems.map((item) => renderNavButton(item))}</div>
                  <ScrollBar orientation="horizontal" className="h-1.5" />
                </ScrollArea>
              </nav>
            </>
          )}
        </div>
      </header>

      {/* Content */}
      {(() => {
        const animatedContent = (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        );

        return isMobile ? (
          <PullToRefresh onRefresh={handleRefresh} className="flex-1 min-h-0">
            <main
              className="mx-auto max-w-7xl px-3 py-3"
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 88px)" }}
              {...swipeHandlers}
            >
              {animatedContent}
            </main>
          </PullToRefresh>
        ) : (
          <main className="mx-auto max-w-7xl px-4 py-6 safe-area-bottom">{animatedContent}</main>
        );
      })()}
    </div>
  );
}
