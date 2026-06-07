import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Home,
  Calendar,
  Wallet,
  Users,
  Menu,
  ShoppingBag,
  Megaphone,
  UserCircle,
  Sparkles,
  Briefcase,
  ChevronDown,
} from "lucide-react";
import { AdminHelpMenu } from "@/components/admin/layout/AdminHelpMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { cn } from "@/lib/utils";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { useTenantAccess } from "@/hooks/useTenantAccess";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { SubscriptionExpiredScreen } from "@/components/admin/SubscriptionExpiredScreen";
import { NotifBadge } from "@/components/admin/layout/NotifBadge";
import { AdminAccountMenu } from "@/components/admin/layout/AdminAccountMenu";
import { AdminCommandPalette } from "@/components/admin/layout/AdminCommandPalette";
import { AdminSubNav, ADMIN_SUB_NAV, getDefaultSubTab, type AdminSection } from "@/components/admin/layout/AdminSubNav";
import { useUnseenOrders } from "@/hooks/useUnseenOrders";
import { motion, AnimatePresence } from "framer-motion";

import {
  ClientsSection,
  CatalogSection,
  MarketingSection,
  InicioSection,
  NegocioSection,
  AgendaSection,
  CajaSection,
} from "@/components/admin/sections";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
}

type SectionValue =
  | "inicio"
  | "agenda"
  | "caja"
  | "clientes"
  | "catalogo"
  | "marketing"
  | "negocio";

interface NavItem {
  value: SectionValue;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const VALID_SECTIONS: SectionValue[] = [
  "inicio",
  "agenda",
  "caja",
  "clientes",
  "catalogo",
  "marketing",
  "negocio",
];

// Map legacy dashboard/tour navigation keys → new (section, subTab) URL slugs.
// Covers both old code-string keys AND old URL paths (inicio/agenda, clientes/resenas, etc.)
const LEGACY_NAV_MAP: Record<string, { section: SectionValue; subTab?: string }> = {
  // Inicio (legacy)
  dashboard: { section: "inicio", subTab: "resumen" },
  resumen: { section: "inicio", subTab: "resumen" },
  actividad: { section: "inicio", subTab: "actividad" },
  // Agenda (now top-level)
  calendar: { section: "agenda", subTab: "dia" },
  agenda: { section: "agenda", subTab: "dia" },
  dia: { section: "agenda", subTab: "dia" },
  semana: { section: "agenda", subTab: "semana" },
  waitlist: { section: "agenda", subTab: "espera" },
  espera: { section: "agenda", subTab: "espera" },
  // Caja (now top-level)
  cash: { section: "caja", subTab: "cobros" },
  caja: { section: "caja", subTab: "cobros" },
  cobros: { section: "caja", subTab: "cobros" },
  orders: { section: "caja", subTab: "pedidos" },
  pedidos: { section: "caja", subTab: "pedidos" },
  cierre: { section: "caja", subTab: "cierre" },
  // Clientes
  clients: { section: "clientes", subTab: "directorio" },
  directory: { section: "clientes", subTab: "directorio" },
  directorio: { section: "clientes", subTab: "directorio" },
  messages: { section: "clientes", subTab: "mensajes" },
  mensajes: { section: "clientes", subTab: "mensajes" },
  // Reseñas now in Marketing
  reviews: { section: "marketing", subTab: "resenas" },
  resenas: { section: "marketing", subTab: "resenas" },
  // Catálogo
  services: { section: "catalogo", subTab: "services" },
  products: { section: "catalogo", subTab: "products" },
  packages: { section: "catalogo", subTab: "packages" },
  catalog: { section: "catalogo" },
  // Promos now in Marketing
  promos: { section: "marketing", subTab: "promos" },
  // Marketing
  marketing: { section: "marketing" },
  posts: { section: "marketing", subTab: "posts" },
  qr: { section: "marketing", subTab: "qr" },
  whatsapp: { section: "marketing", subTab: "posts" },
  // Negocio
  team: { section: "negocio", subTab: "equipo" },
  equipo: { section: "negocio", subTab: "equipo" },
  stylists: { section: "negocio", subTab: "equipo" },
  hours: { section: "negocio", subTab: "equipo" },
  reports: { section: "negocio", subTab: "informes" },
  informes: { section: "negocio", subTab: "informes" },
  stats: { section: "negocio", subTab: "informes" },
  goals: { section: "negocio", subTab: "informes" },
  settings: { section: "negocio", subTab: "ajustes" },
  ajustes: { section: "negocio", subTab: "ajustes" },
};

// Legacy URL combos that must be transparently redirected to their new home.
// Triggered from the URL normalization effect.
const LEGACY_URL_REDIRECTS: Record<string, { section: SectionValue; subTab: string }> = {
  "inicio/agenda": { section: "agenda", subTab: "dia" },
  "inicio/caja": { section: "caja", subTab: "cobros" },
  "inicio/espera": { section: "agenda", subTab: "espera" },
  "inicio/pedidos": { section: "caja", subTab: "pedidos" },
  "clientes/resenas": { section: "marketing", subTab: "resenas" },
  "catalogo/promos": { section: "marketing", subTab: "promos" },
};

export default function TenantAdmin() {
  const [userEmail, setUserEmail] = useState("");
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

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

  const unseenOrders = useUnseenOrders(tenant?.id || "");
  const [waitlistCount, setWaitlistCount] = useState(0);

  useEffect(() => {
    if (!tenant?.id) return;
    let cancelled = false;
    const fetchWaitlist = async () => {
      const { count } = await supabase
        .from("waitlist")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenant.id)
        .eq("status", "waiting");
      if (!cancelled) setWaitlistCount(count || 0);
    };
    fetchWaitlist();
    const channel = supabase
      .channel(`tenant-admin-waitlist-${tenant.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "waitlist", filter: `tenant_id=eq.${tenant.id}` },
        () => fetchWaitlist(),
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [tenant?.id]);

  // Resolve active section from URL (default = inicio)
  const activeSection: SectionValue = useMemo(() => {
    if (sectionParam && VALID_SECTIONS.includes(sectionParam as SectionValue)) {
      return sectionParam as SectionValue;
    }
    return "inicio";
  }, [sectionParam]);

  const activeSubTab = subTabParam || getDefaultSubTab(activeSection as AdminSection);

  const subNavCounts = useMemo(
    () => ({
      waitlist: waitlistCount,
      orders: unseenOrders,
      messages: notificationCounts.messages,
      reviews: notificationCounts.reviews,
    }),
    [waitlistCount, unseenOrders, notificationCounts.messages, notificationCounts.reviews],
  );

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
      try {
        setTenantLoading(true);
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
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

        if (tenantError) throw tenantError;

        if (!tenantData) {
          toast({ title: "Error", description: "No se encontró el salón", variant: "destructive" });
          navigate("/");
          return;
        }

        setTenant(tenantData);
      } catch (error) {
        console.error("Error loading tenant admin:", error);
        toast({
          title: "No se pudo cargar el salón",
          description: "Parece un problema de conexión. Recarga esta pantalla en unos segundos.",
          variant: "destructive",
        });
      } finally {
        setTenantLoading(false);
      }
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
            subTab={activeSubTab}
            onNavigate={(path) => {
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
            subTab={activeSubTab}
            onSubTabChange={(t) => goToSection("clientes", t)}
            hideTabs
          />
        );
      case "catalogo":
        return (
          <CatalogSection
            key={refreshKey}
            tenantId={tenant.id}
            subTab={activeSubTab}
            onSubTabChange={(t) => goToSection("catalogo", t)}
            hideTabs
          />
        );
      case "marketing":
        return (
          <MarketingSection
            key={refreshKey}
            tenantId={tenant.id}
            tenantSlug={tenant.slug}
            subTab={activeSubTab}
            onSubTabChange={(t) => goToSection("marketing", t)}
            hideTabs
          />
        );
      case "negocio":
        return (
          <NegocioSection
            key={refreshKey}
            tenantId={tenant.id}
            tenantSlug={tenant.slug}
            subTab={activeSubTab}
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

  const activeSectionLabel = navItems.find((i) => i.value === activeSection)?.label || "Inicio";
  const activeSubLabel =
    ADMIN_SUB_NAV[activeSection as AdminSection]?.find((s) => s.value === activeSubTab)?.label
    || activeSectionLabel;

  const primaryNav = navItems.slice(0, 4);
  const extraNav = navItems.slice(4);
  const extraActive = extraNav.some((n) => n.value === activeSection);

  return (
    <div className="gp-shell">
      <AdminCommandPalette
        tenantSlug={slug || ""}
        onNavigate={(path) => navigate(path)}
        onNewBooking={() => goToSection("inicio", "agenda")}
        onViewWeb={() => navigate(`/${slug}`)}
        onSignOut={handleSignOut}
      />

      {/* ── Desktop Sidebar ── */}
      <aside className="gp-side">
        <div className="gp-brand">
          {tenant.logo_url ? (
            <img
              src={tenant.logo_url}
              alt={tenant.name}
              className="gp-logo"
              style={{ objectFit: "cover", padding: 0 }}
            />
          ) : (
            <span className="gp-logo">G</span>
          )}
          <span className="gp-brand-tx">
            <span className="gp-brand-name">{tenant.name}</span>
            <span className="gp-brand-sub">Panel de administración</span>
          </span>
        </div>

        <nav className="gp-nav">
          {navItems.map((item) => {
            const isActive = activeSection === item.value;
            const subs = ADMIN_SUB_NAV[item.value as AdminSection] || [];
            const badgeCount = typeof item.badge === "number" ? item.badge : 0;
            return (
              <div key={item.value}>
                <button
                  className={`gp-navitem${isActive ? " on" : ""}`}
                  onClick={() => handleTabClick(item.value)}
                  data-tour-step={`nav-${item.value}`}
                >
                  <span className="gp-navitem-ic">{item.icon}</span>
                  {item.label}
                  {badgeCount > 0 && !isActive && (
                    <span className="gp-navitem-badge">{badgeCount}</span>
                  )}
                  {subs.length > 1 && (
                    <ChevronDown
                      className="h-3.5 w-3.5"
                      style={{
                        marginLeft: "auto", flexShrink: 0, transition: "transform .2s",
                        transform: isActive ? "rotate(0deg)" : "rotate(-90deg)",
                      }}
                    />
                  )}
                </button>
                {isActive && subs.length > 1 && (
                  <div className="gp-side-subnav">
                    {subs.map((sub) => {
                      const subBadge = sub.badgeKey
                        ? subNavCounts[sub.badgeKey as keyof typeof subNavCounts] || 0
                        : 0;
                      return (
                        <button
                          key={sub.value}
                          className={`gp-subitem${activeSubTab === sub.value ? " on" : ""}`}
                          onClick={() => goToSection(item.value as SectionValue, sub.value)}
                        >
                          <span className="gp-subdot" />
                          {sub.label}
                          {subBadge > 0 && (
                            <span className="gp-subitem-badge">{subBadge}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="gp-side-foot">
          <div className="gp-user-row">
            <span className="gp-ava">
              {userEmail ? userEmail.slice(0, 2).toUpperCase() : "AD"}
            </span>
            <span className="gp-user-tx">
              <span className="gp-user-name">{userEmail}</span>
              <span className="gp-user-role">Plan {subscriptionPlan || "Starter"}</span>
            </span>
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
      </aside>

      {/* ── Main Column ── */}
      <div className="gp-main-wrap">

        {/* Topbar */}
        <header className="gp-topbar" style={{ paddingTop: "env(safe-area-inset-top)" }}>
          <div className="gp-top-titlewrap">
            <span className="gp-top-crumb">{activeSectionLabel}</span>
            <span className="gp-top-title">{activeSubLabel}</span>
          </div>
          <div className="gp-top-spacer" />
          <AdminHelpMenu onTourTabChange={handleNavigate} />
          {/* Account menu: visible on mobile where sidebar is hidden */}
          <span className="gp-topbar-account-mobile">
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
          </span>
          <button
            className="gp-new-cita-btn"
            onClick={() => goToSection("inicio", "agenda")}
          >
            <Sparkles className="h-4 w-4" />
            <span className="gp-hide-sm">Nueva cita</span>
          </button>
        </header>

        {/* Sub-nav: desktop sees sidebar sub-items; mobile sees this row */}
        <div className="gp-subnav-bar">
          <AdminSubNav
            tenantId={tenant.id}
            section={activeSection as AdminSection}
            activeSubTab={activeSubTab}
            counts={subNavCounts}
            onSelect={(t) => goToSection(activeSection, t)}
          />
        </div>

        {/* Content */}
        <main
          className="gp-content"
          style={isMobile ? { paddingBottom: "calc(env(safe-area-inset-bottom) + 88px)" } : undefined}
          {...swipeHandlers}
        >
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
        </main>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="gp-bottom">
        {primaryNav.map((item) => (
          <button
            key={item.value}
            className={`gp-bottom-item${activeSection === item.value ? " on" : ""}`}
            onClick={() => handleTabClick(item.value)}
          >
            <span className="gp-bottom-ic">{item.icon}</span>
            {item.label}
          </button>
        ))}
        {extraNav.length > 0 && (
          <button
            className={`gp-bottom-item${extraActive ? " on" : ""}`}
            onClick={() => setMoreOpen(true)}
          >
            <span className="gp-bottom-ic"><Menu className="h-5 w-5" /></span>
            Más
          </button>
        )}
      </nav>

      {/* More bottom sheet */}
      {moreOpen && (
        <div className="gp-more-wrap" onClick={() => setMoreOpen(false)}>
          <div className="gp-more" onClick={(e) => e.stopPropagation()}>
            <div className="gp-more-grip" />
            <h4 className="gp-more-title">Más secciones</h4>
            <div className="gp-more-grid">
              {extraNav.map((item) => (
                <button
                  key={item.value}
                  className={`gp-more-item${activeSection === item.value ? " on" : ""}`}
                  onClick={() => { handleTabClick(item.value); setMoreOpen(false); }}
                >
                  <span className="gp-more-ic">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
