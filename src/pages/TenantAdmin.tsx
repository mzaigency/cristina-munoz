import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  LogOut,
  Loader2,
  Home,
  Calendar,
  MessageCircle,
  Wallet,
  ExternalLink,
  Settings,
  Scissors,
  Users,
  LayoutDashboard,
  UserCircle,
  Menu,
} from "lucide-react";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
// ClientsCRM is now rendered inside AgendaSection
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

// Import consolidated sections
import {
  BusinessSection,
  TeamSection,
  SettingsSection,
  AgendaSection,
  CommunicationSection,
} from "@/components/admin/sections";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
}

interface Stylist {
  id: string;
  name: string;
  slug: string;
  color: string;
}

// Simplified to 6 main tabs
type TabValue = "dashboard" | "agenda" | "business" | "team" | "communication" | "settings";

interface NavItem {
  value: TabValue;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export default function TenantAdmin() {
  const [userEmail, setUserEmail] = useState("");
  const [activeTab, setActiveTab] = useState<TabValue>("dashboard");
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useNavigate();
  const { adminSlug: slug } = useParams<{ adminSlug: string }>();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Use tenant access hook to check permissions — this is the single source of truth for auth
  const { isAdmin, isStylist, hasAccess, loading: accessLoading, userId } = useTenantAccess(tenant?.id);

  // Check subscription status
  const { isExpired: subscriptionExpired, plan: subscriptionPlan, loading: subscriptionLoading } = useSubscriptionStatus(tenant?.id);

  // Use admin notifications hook
  const {
    counts: notificationCounts,
    getCommunicationCount,
    refetch: refetchNotifications,
    markSectionViewed,
  } = useAdminNotifications(tenant?.id || null);

  // El badge se oculta inmediatamente al hacer click en handleTabClick

  // Navigation items - filter based on role (stylists don't see Settings or Team)
  const navItems: NavItem[] = useMemo(() => {
    const allItems: NavItem[] = [
      { value: "dashboard", label: "Inicio", icon: <LayoutDashboard className="h-4 w-4" /> },
      { value: "agenda", label: "Agenda", icon: <Calendar className="h-4 w-4" />, badge: notificationCounts.agenda },
      { value: "business", label: "Negocio", icon: <Wallet className="h-4 w-4" /> },
      { value: "team", label: "Equipo", icon: <Users className="h-4 w-4" /> },
      {
        value: "communication",
        label: "Comunica",
        icon: <MessageCircle className="h-4 w-4" />,
        badge: getCommunicationCount(),
      },
      { value: "settings", label: "Ajustes", icon: <Settings className="h-4 w-4" /> },
    ];

    // If user is stylist but not admin, hide Settings and Team tabs
    if (isStylist && !isAdmin) {
      return allItems.filter((item) => item.value !== "settings" && item.value !== "team");
    }

    return allItems;
  }, [notificationCounts.agenda, getCommunicationCount, isAdmin, isStylist]);

  const tabOrder = navItems.map((item) => item.value);

  const { handlers: swipeHandlers } = useSwipeNavigation({
    tabs: tabOrder,
    currentTab: activeTab,
    onTabChange: (tab) => setActiveTab(tab as TabValue),
    enabled: isMobile,
  });

  // Fetch tenant by slug (no auth checks — useTenantAccess handles that)
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
        toast({
          title: "Error",
          description: "No se encontró el salón",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setTenant(tenantData);
      setTenantLoading(false);
    };

    fetchTenant();
  }, [slug]);

  // Redirect if access check completes and user has no access
  useEffect(() => {
    if (!tenantLoading && !accessLoading && tenant && !hasAccess) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para acceder a este panel",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [tenantLoading, accessLoading, hasAccess, tenant]);

  useEffect(() => {
    if (tenant?.id) {
      fetchStylists();
    }
  }, [tenant?.id]);

  const fetchStylists = async () => {
    if (!tenant?.id) return;

    const { data, error } = await supabase
      .from("tenant_stylists")
      .select("id, name, slug, color")
      .eq("tenant_id", tenant.id)
      .eq("is_active", true);

    if (!error && data) {
      setStylists(
        data.map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          color: s.color || "#8B5CF6",
        })),
      );
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch (error) {
      console.error("Error during sign out:", error);
    }

    try {
      localStorage.removeItem("supabase.auth.token");
    } catch (e) {
      console.error("Error clearing localStorage:", e);
    }

    navigate("/auth", { replace: true });
  };

  const handleRefresh = useCallback(async () => {
    setRefreshKey((prev) => prev + 1);
    if (tenant?.id) {
      await Promise.all([refetchNotifications(), fetchStylists()]);
    }
    toast({
      title: "Actualizado",
      description: "Datos actualizados correctamente",
    });
  }, [tenant?.id, refetchNotifications]);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "new-booking":
        setActiveTab("agenda");
        break;
      case "new-payment":
        setActiveTab("business");
        break;
      case "block-slot":
        setActiveTab("agenda");
        break;
      case "new-service":
        setActiveTab("team");
        break;
      default:
        break;
    }
  };

  const renderContent = () => {
    if (!tenant) return null;

    switch (activeTab) {
      case "dashboard":
        return (
          <AdminDashboard
            key={refreshKey}
            tenantId={tenant.id}
            onNavigate={(tab) => {
              // Map old tab names to new ones
              const tabMap: Record<string, TabValue> = {
                calendar: "agenda",
                cash: "business",
                services: "team",
                stylists: "team",
                messages: "communication",
                settings: "settings",
                clients: "agenda",
              };
              setActiveTab(tabMap[tab] || (tab as TabValue));
            }}
            onQuickAction={handleQuickAction}
          />
        );
      case "agenda":
        return (
          <AgendaSection 
            key={refreshKey} 
            tenantId={tenant.id}
            onNavigateToCash={() => {
              setActiveTab("business");
              // Signal to open cash tab
              sessionStorage.setItem('openCashTab', 'true');
            }}
          />
        );
      case "business":
        return <BusinessSection key={refreshKey} tenantId={tenant.id} />;
      case "team":
        return <TeamSection key={refreshKey} tenantId={tenant.id} />;
      case "communication":
        return <CommunicationSection key={refreshKey} tenantId={tenant.id} />;
      case "settings":
        return <SettingsSection key={refreshKey} tenantId={tenant.id} tenantSlug={tenant.slug} />;
      default:
        return null;
    }
  };

  const handleTabClick = (tab: TabValue) => {
    if (tab !== "dashboard") {
      markSectionViewed(tab);
    }
    setActiveTab(tab);
    if (isMobile) setSidebarOpen(false);
  };

  const renderNavButton = (item: NavItem) => {
    const isActive = activeTab === item.value;
    const badgeCount = typeof item.badge === "number" ? item.badge : 0;
    // Solo mostrar badge si NO es el tab activo (desaparece al instante)
    const showBadge = badgeCount > 0 && activeTab !== item.value;

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
          {showBadge && (
            <span
              className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground"
              aria-hidden="true"
            >
              {badgeCount > 9 ? "9+" : badgeCount}
            </span>
          )}
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

  if (!hasAccess || !tenant) {
    return null;
  }

  // Block access if subscription is expired
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
            {/* Sidebar Header */}
            <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ paddingTop: "calc(env(safe-area-inset-top) + 20px)" }}>
              {tenant.logo_url ? (
                <img
                  src={tenant.logo_url}
                  alt={tenant.name}
                  className="h-10 w-10 rounded-xl object-cover ring-2 ring-primary/20 shrink-0"
                />
              ) : (
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Scissors className="h-5 w-5 text-primary" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-bold text-foreground truncate">{tenant.name}</h2>
                <p className="text-[11px] text-muted-foreground truncate">{userEmail}</p>
              </div>
            </div>

            {/* Sidebar Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.value;
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
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {item.icon}
                    <span className="flex-1 text-left">{item.label}</span>
                    {showBadge && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                        {badgeCount > 9 ? "9+" : badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Sidebar Footer */}
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
            /* Mobile Header - simplified */
            <div className="flex items-center justify-between py-2.5">
              <Button
                onClick={() => setSidebarOpen(true)}
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                aria-label="Abrir menú"
              >
                <Menu className="h-5 w-5" />
              </Button>

              <div className="flex items-center gap-2 min-w-0 flex-1 justify-center">
                {tenant.logo_url ? (
                  <img
                    src={tenant.logo_url}
                    alt={tenant.name}
                    className="h-8 w-8 rounded-lg object-cover ring-2 ring-primary/20 shrink-0"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Scissors className="h-4 w-4 text-primary" />
                  </div>
                )}
                <h1 className="text-sm font-bold text-foreground truncate">{tenant.name}</h1>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <InteractiveTour
                  onTabChange={(tab) => {
                    const tabMap: Record<string, TabValue> = {
                      calendar: "agenda", cash: "business", services: "team",
                      stylists: "team", messages: "communication", settings: "settings",
                      clients: "agenda", dashboard: "dashboard",
                    };
                    setActiveTab(tabMap[tab] || (tab as TabValue));
                  }}
                />
                <HelpTutorial />
              </div>
            </div>
          ) : (
            /* Desktop Header - original layout */
            <>
              <div className="flex items-center justify-between py-3 border-b border-border/50">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {tenant.logo_url ? (
                    <img
                      src={tenant.logo_url}
                      alt={tenant.name}
                      className="h-10 w-10 rounded-xl object-cover ring-2 ring-primary/20 shrink-0"
                    />
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

                <div className="flex items-center gap-2 shrink-0">
                  <InteractiveTour
                    onTabChange={(tab) => {
                      const tabMap: Record<string, TabValue> = {
                        calendar: "agenda", cash: "business", services: "team",
                        stylists: "team", messages: "communication", settings: "settings",
                        clients: "clients", dashboard: "dashboard",
                      };
                      setActiveTab(tabMap[tab] || (tab as TabValue));
                    }}
                  />
                  <HelpTutorial />
                  <Button
                    onClick={() => navigate(`/${slug}`)}
                    variant="outline"
                    size="sm"
                    className="gap-1 h-9 px-3 text-sm"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Ver web</span>
                  </Button>
                  <Button onClick={() => navigate("/")} variant="ghost" size="icon" className="h-9 w-9" title="Inicio">
                    <Home className="h-5 w-5" />
                  </Button>
                  <Button onClick={handleSignOut} variant="ghost" size="icon" className="h-9 w-9" title="Cerrar sesión">
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Desktop Navigation */}
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
      {isMobile ? (
        <PullToRefresh onRefresh={handleRefresh} className="flex-1 min-h-0">
          <main className="mx-auto max-w-7xl px-3 py-3 safe-area-bottom pb-24" {...swipeHandlers}>
            {renderContent()}
          </main>
        </PullToRefresh>
      ) : (
        <main className="mx-auto max-w-7xl px-4 py-6 safe-area-bottom">{renderContent()}</main>
      )}
    </div>
  );
}
