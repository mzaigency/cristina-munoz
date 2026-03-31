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
import { ClientsCRM } from "@/components/admin/ClientsCRM";
import { HelpTutorial } from "@/components/admin/HelpTutorial";

import { InteractiveTour } from "@/components/admin/InteractiveTour";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
type TabValue = "dashboard" | "agenda" | "clients" | "business" | "team" | "communication" | "settings";

interface NavItem {
  value: TabValue;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export default function TenantAdmin() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [activeTab, setActiveTab] = useState<TabValue>("dashboard");
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const navigate = useNavigate();
  const { adminSlug: slug } = useParams<{ adminSlug: string }>();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Use tenant access hook to check permissions
  const { isAdmin, isStylist, stylistId } = useTenantAccess(tenant?.id);

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
      {
        value: "clients",
        label: "Clientes",
        icon: <UserCircle className="h-4 w-4" />,
        badge: notificationCounts.clients,
      },
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
  }, [notificationCounts.agenda, notificationCounts.clients, getCommunicationCount, isAdmin, isStylist]);

  const tabOrder = navItems.map((item) => item.value);

  const { handlers: swipeHandlers } = useSwipeNavigation({
    tabs: tabOrder,
    currentTab: activeTab,
    onTabChange: (tab) => setActiveTab(tab as TabValue),
    enabled: isMobile,
  });

  useEffect(() => {
    checkAuth();
  }, [slug]);

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

  const checkAuth = async () => {
    if (!slug) {
      navigate("/");
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

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

    const userId = session.user.id;

    const { data: superadminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "superadmin")
      .maybeSingle();

    if (superadminRole) {
      setHasAccess(true);
      setLoading(false);
      return;
    }

    const { data: adminData } = await supabase
      .from("tenant_admins")
      .select("id")
      .eq("user_id", userId)
      .eq("tenant_id", tenantData.id)
      .maybeSingle();

    if (adminData) {
      setHasAccess(true);
      setLoading(false);
      return;
    }

    const { data: stylistData } = await supabase
      .from("tenant_stylists")
      .select("id")
      .eq("user_id", userId)
      .eq("tenant_id", tenantData.id)
      .maybeSingle();

    if (stylistData) {
      setHasAccess(true);
      setLoading(false);
      return;
    }

    toast({
      title: "Acceso denegado",
      description: "No tienes permisos para acceder a este panel",
      variant: "destructive",
    });
    navigate("/");
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
                clients: "clients",
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
      case "clients":
        return <ClientsCRM key={refreshKey} tenantId={tenant.id} />;
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
    // Marcar como visto INMEDIATAMENTE al hacer click
    if (tab !== "dashboard") {
      markSectionViewed(tab);
    }
    setActiveTab(tab);
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
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header
        className="sticky top-0 z-50 bg-background border-b shadow-sm"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto max-w-7xl px-3 sm:px-4">
          {/* Top row - Logo, title and actions */}
          <div className="flex items-center justify-between py-2.5 sm:py-3 border-b border-border/50">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              {tenant.logo_url ? (
                <img
                  src={tenant.logo_url}
                  alt={tenant.name}
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl object-cover ring-2 ring-primary/20 shrink-0"
                />
              ) : (
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Scissors className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-base md:text-lg font-bold text-foreground truncate">{tenant.name}</h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{userEmail}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <InteractiveTour
                onTabChange={(tab) => {
                  // Map old tab names to new ones for tour
                  const tabMap: Record<string, TabValue> = {
                    calendar: "agenda",
                    cash: "business",
                    services: "team",
                    stylists: "team",
                    messages: "communication",
                    settings: "settings",
                    clients: "clients",
                    dashboard: "dashboard",
                  };
                  setActiveTab(tabMap[tab] || (tab as TabValue));
                }}
              />
              <HelpTutorial />

              <Button
                onClick={() => navigate(`/${slug}`)}
                variant="outline"
                size="sm"
                className="gap-1 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
                aria-label="Ver página web del salón"
              >
                <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Ver web</span>
              </Button>
              <Button
                onClick={() => navigate("/")}
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9"
                title="Inicio"
                aria-label="Ir a inicio"
              >
                <Home className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>

          {/* Navigation - Clean horizontal tabs for both mobile and desktop */}
          <nav className="flex items-center py-2" aria-label="Navegación del panel de administración" role="tablist">
            {isMobile ? (
              <div className="flex items-center gap-1 w-full overflow-x-auto no-scrollbar pb-1">
                {navItems.map((item) => renderNavButton(item))}
              </div>
            ) : (
              <ScrollArea className="w-full">
                <div className="flex items-center gap-2 pb-2">{navItems.map((item) => renderNavButton(item))}</div>
                <ScrollBar orientation="horizontal" className="h-1.5" />
              </ScrollArea>
            )}
          </nav>
        </div>
      </header>

      {/* Content with Pull to Refresh on mobile + Swipe navigation */}
      {isMobile ? (
        <PullToRefresh onRefresh={handleRefresh} className="flex-1 min-h-0">
          <main className="mx-auto max-w-7xl px-3 sm:px-4 py-3 sm:py-4 safe-area-bottom pb-24" {...swipeHandlers}>
            {renderContent()}
          </main>
        </PullToRefresh>
      ) : (
        <main className="mx-auto max-w-7xl px-4 py-6 safe-area-bottom">{renderContent()}</main>
      )}
    </div>
  );
}
