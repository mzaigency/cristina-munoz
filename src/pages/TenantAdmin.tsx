import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Preloader } from "@/components/ui/preloader";
import { useToast } from "@/hooks/use-toast";
import {
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
  Settings,
  Lock,
  Search,
  Bell,
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
import { usePlanLimits } from "@/hooks/usePlanLimits";
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
  SettingsSection,
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
  | "negocio"
  | "ajustes";

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
  "ajustes",
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
  historial: { section: "caja", subTab: "historial" },
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
  marketing: { section: "marketing", subTab: "resumen" },
  posts: { section: "marketing", subTab: "posts" },
  qr: { section: "marketing", subTab: "qr" },
  whatsapp: { section: "marketing", subTab: "difusion" },
  difusion: { section: "marketing", subTab: "difusion" },
  broadcast: { section: "marketing", subTab: "difusion" },
  // Negocio
  negocio: { section: "negocio", subTab: "resumen" },
  team: { section: "negocio", subTab: "equipo" },
  equipo: { section: "negocio", subTab: "equipo" },
  stylists: { section: "negocio", subTab: "equipo" },
  hours: { section: "negocio", subTab: "horarios" },
  horarios: { section: "negocio", subTab: "horarios" },
  reports: { section: "negocio", subTab: "objetivos" },
  informes: { section: "negocio", subTab: "estadisticas" },
  stats: { section: "negocio", subTab: "estadisticas" },
  estadisticas: { section: "negocio", subTab: "estadisticas" },
  goals: { section: "negocio", subTab: "objetivos" },
  objetivos: { section: "negocio", subTab: "objetivos" },
  commissions: { section: "negocio", subTab: "equipo" },
  comisiones: { section: "negocio", subTab: "equipo" },
  settings: { section: "ajustes", subTab: "general" },
  ajustes: { section: "ajustes", subTab: "general" },
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
  "negocio/ajustes": { section: "ajustes", subTab: "general" },
};

export default function TenantAdmin() {
  const [userEmail, setUserEmail] = useState("");
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const [chromeHidden, setChromeHidden] = useState(false);
  const mainWrapRef = useRef<HTMLDivElement>(null);

  // Header + tabs: ocultar al scrollear hacia abajo, mostrar al subir (móvil)
  useEffect(() => {
    const el = mainWrapRef.current;
    if (!el) return;
    let last = el.scrollTop;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = el.scrollTop;
        if (y < 8) setChromeHidden(false);
        else if (y > last + 6) setChromeHidden(true);
        else if (y < last - 6) setChromeHidden(false);
        last = y;
        ticking = false;
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

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
  const { hasFeature } = usePlanLimits(tenant?.id || "");
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

  /* La tipografía del panel se aplica desde body para que la hereden también
     los diálogos y hojas de Radix, que se montan en un portal fuera del shell. */
  useEffect(() => {
    document.body.setAttribute("data-glow-panel", "");
    return () => document.body.removeAttribute("data-glow-panel");
  }, []);

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
    const clientsBadge = notificationCounts.messages;
    const agendaBadge = waitlistCount;
    const cajaBadge = unseenOrders;
    const marketingBadge = notificationCounts.reviews;
    const allItems: NavItem[] = [
      { value: "inicio", label: "Inicio", icon: <Home className="h-4 w-4" />, badge: notificationCounts.agenda },
      { value: "agenda", label: "Agenda", icon: <Calendar className="h-4 w-4" />, badge: agendaBadge },
      { value: "caja", label: "Caja", icon: <Wallet className="h-4 w-4" />, badge: cajaBadge },
      { value: "clientes", label: "Clientes", icon: <UserCircle className="h-4 w-4" />, badge: clientsBadge },
      { value: "catalogo", label: "Catálogo", icon: <ShoppingBag className="h-4 w-4" /> },
      { value: "marketing", label: "Marketing", icon: <Megaphone className="h-4 w-4" />, badge: marketingBadge },
      { value: "negocio", label: "Negocio", icon: <Briefcase className="h-4 w-4" /> },
      { value: "ajustes", label: "Ajustes", icon: <Settings className="h-4 w-4" /> },
    ];
    if (isStylist && !isAdmin) {
      return allItems.filter((item) => !["marketing", "negocio", "ajustes"].includes(item.value));
    }
    return allItems;
  }, [notificationCounts, isAdmin, isStylist, waitlistCount, unseenOrders]);

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

  // Normalize URL: default to /inicio, redirect legacy combos, validate section.
  useEffect(() => {
    if (!slug) return;
    if (!sectionParam) {
      navigate(`/admin/${slug}/inicio`, { replace: true });
      return;
    }
    // Transparent redirect for legacy URL combos (old links / bookmarks)
    const legacyKey = `${sectionParam}/${subTabParam || ""}`.replace(/\/$/, "");
    const legacy = LEGACY_URL_REDIRECTS[legacyKey];
    if (legacy) {
      navigate(`/admin/${slug}/${legacy.section}/${legacy.subTab}`, { replace: true });
      return;
    }
    if (!VALID_SECTIONS.includes(sectionParam as SectionValue)) {
      navigate(`/admin/${slug}/inicio`, { replace: true });
    }
  }, [slug, sectionParam, subTabParam, navigate]);

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
    else if (activeSection === "agenda" || activeSection === "inicio") markSectionViewed("agenda");
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

  // Legacy navigate adapter used by AdminDashboard and SpotlightTour
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
      case "agenda":
        return (
          <AgendaSection
            key={refreshKey}
            tenantId={tenant.id}
            subTab={activeSubTab}
            onSelectClient={() => goToSection("clientes", "directorio")}
          />
        );
      case "caja":
        return (
          <CajaSection
            key={refreshKey}
            tenantId={tenant.id}
            subTab={activeSubTab}
          />
        );
      case "clientes":
        return (
          <ClientsSection
            key={refreshKey}
            tenantId={tenant.id}
            subTab={activeSubTab}
          />
        );
      case "catalogo":
        return (
          <CatalogSection
            key={refreshKey}
            tenantId={tenant.id}
            subTab={activeSubTab}
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
          />
        );
      case "negocio":
        return (
          <NegocioSection
            key={refreshKey}
            tenantId={tenant.id}
            tenantSlug={tenant.slug}
            subTab={activeSubTab}
            onSubTabChange={(t) => goToSection("negocio", t)}
          />
        );
      case "ajustes":
        return (
          <SettingsSection
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
  };

  const loading = tenantLoading || accessLoading;

  if (loading || subscriptionLoading) {
    return <Preloader ready={false} />;
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
    <div className="glow-shell">
      <Preloader
        ready
        text={tenant.name}
        logoUrl={tenant.logo_url}
        accentColor={tenant.primary_color}
      />
      <AdminCommandPalette
        tenantSlug={slug || ""}
        onNavigate={(path) => navigate(path)}
        onNewBooking={() => goToSection("agenda", "dia")}
        onViewWeb={() => navigate(`/${slug}`)}
        onSignOut={handleSignOut}
      />

      {/* ── Desktop Sidebar ── */}
      <aside className="glow-side">
        <div className="glow-brand">
          {tenant.logo_url ? (
            <img
              src={tenant.logo_url}
              alt={tenant.name}
              className="glow-logo"
              style={{ objectFit: "cover", padding: 0 }}
            />
          ) : (
            <span className="glow-logo">G</span>
          )}
          <span className="glow-brand-tx">
            <span className="glow-brand-name">{tenant.name}</span>
            <span className="glow-brand-sub">Panel de administración</span>
          </span>
        </div>

        <nav className="glow-nav" data-tour-target="sidebar-nav">
          {navItems.map((item) => {
            const isActive = activeSection === item.value;
            const subs = ADMIN_SUB_NAV[item.value as AdminSection] || [];
            const badgeCount = typeof item.badge === "number" ? item.badge : 0;
            return (
              <div key={item.value}>
                <button
                  className={`glow-navitem${isActive ? " on" : ""}`}
                  onClick={() => handleTabClick(item.value)}
                  data-tour-step={`nav-${item.value}`}
                  data-tour-nav={item.value}
                >
                  <span className="glow-navitem-ic">{item.icon}</span>
                  {item.label}
                  {badgeCount > 0 && !isActive && (
                    <span className="glow-navitem-badge">{badgeCount}</span>
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
                  <div className="glow-side-subnav">
                    {subs.map((sub) => {
                      const subBadge = sub.badgeKey
                        ? subNavCounts[sub.badgeKey as keyof typeof subNavCounts] || 0
                        : 0;
                      const locked = sub.requiredFeature ? !hasFeature(sub.requiredFeature) : false;
                      return (
                        <button
                          key={sub.value}
                          className={`glow-subitem${activeSubTab === sub.value ? " on" : ""}${locked ? " locked" : ""}`}
                          onClick={() => { if (!locked) goToSection(item.value as SectionValue, sub.value); }}
                        >
                          {locked ? <Lock style={{ width: 11, height: 11, flexShrink: 0 }} /> : <span className="glow-subdot" />}
                          {sub.label}
                          {locked && (
                            <span className="glow-subitem-badge" style={{ color: "var(--glow-warn-ink)", marginLeft: "auto" }}>Pro</span>
                          )}
                          {subBadge > 0 && !locked && (
                            <span className="glow-subitem-badge">{subBadge}</span>
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

        <div className="glow-side-foot">
          <div className="glow-user-row">
            <span className="glow-ava">
              {userEmail ? userEmail.slice(0, 2).toUpperCase() : "AD"}
            </span>
            <span className="glow-user-tx">
              <span className="glow-user-name">{userEmail}</span>
              <span className="glow-user-role">{subscriptionPlan || "Starter"}</span>
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
      <div className="glow-main-wrap" ref={mainWrapRef}>

        {/* Chrome sticky (header + tabs se ocultan/muestran juntos al scrollear) */}
        <div className={`glow-chrome${chromeHidden ? "glow-chrome--hidden" : ""}`}>

        {/* Topbar */}
        <header className="glow-topbar" style={{ paddingTop: "env(safe-area-inset-top)" }}>
          {/* Brand — solo móvil (desktop usa sidebar) */}
          <div className="glow-topbar-brand">
            {tenant.logo_url ? (
              <img src={tenant.logo_url} alt={tenant.name} className="glow-topbar-brand-logo" />
            ) : (
              <span className="glow-topbar-brand-logo">{tenant.name.charAt(0).toUpperCase()}</span>
            )}
            <span className="glow-topbar-brand-name">{tenant.name}</span>
          </div>
          {/* Título — solo desktop */}
          <div className="glow-top-titlewrap">
            <span className="glow-top-crumb">{activeSectionLabel}</span>
            <span className="glow-top-title">{activeSubLabel}</span>
          </div>
          <div className="glow-top-spacer" />
          {/* Iconos móvil: buscar (paleta) + notificaciones */}
          <button
            className="glow-topbar-icon"
            aria-label="Buscar"
            onClick={() => window.dispatchEvent(new Event("admin:open-command"))}
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            className="glow-topbar-icon"
            aria-label="Notificaciones"
            onClick={() => goToSection("clientes", "mensajes")}
          >
            <Bell className="h-5 w-5" />
            {notificationCounts.messages > 0 && <span className="glow-topbar-icon-dot" />}
          </button>
          <span className="glow-hide-sm">
            <AdminHelpMenu tenantId={tenant.id} onTourTabChange={handleNavigate} />
          </span>
          {/* Account menu: visible on mobile where sidebar is hidden */}
          <span className="glow-topbar-account-mobile">
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
          <div className="glow-topbar-actions">
            <button
              className="glow-topbar-cobrar"
              onClick={() => goToSection("caja", "cobros")}
              title="Cobrar"
            >
              <Wallet className="h-4 w-4" />
              <span>Cobrar</span>
            </button>
            <button
              className="glow-new-cita-btn"
              onClick={() => {
                // Antes solo navegaba a la agenda: el botón decía "Nueva cita"
                // y no abría nada. La bandeja la recoge AgendaSection.
                sessionStorage.setItem("openNewBooking", "1");
                goToSection("agenda", "dia");
              }}
              title="Nueva cita"
            >
              <Sparkles className="h-4 w-4" />
              <span>Nueva cita</span>
            </button>
          </div>
        </header>

        {/* Sub-nav: desktop sees sidebar sub-items; mobile sees this row */}
        <div className="glow-subnav-bar">
          <AdminSubNav
            tenantId={tenant.id}
            section={activeSection as AdminSection}
            activeSubTab={activeSubTab}
            counts={subNavCounts}
            onSelect={(t) => goToSection(activeSection, t)}
          />
        </div>
        </div>
        {/* /glow-chrome */}

        {/* Content */}
        <main
          className="glow-content"
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
      <nav className="glow-bottom" data-tour-target="mobile-bottom-nav">
        {primaryNav.map((item) => {
          const badgeCount = typeof item.badge === "number" ? item.badge : 0;
          const showBadge = badgeCount > 0 && activeSection !== item.value;
          return (
            <button
              key={item.value}
              className={`glow-bottom-item${activeSection === item.value ? " on" : ""}`}
              onClick={() => handleTabClick(item.value)}
              data-tour-nav={item.value}
            >
              <span className="glow-bottom-ic" style={{ position: "relative" }}>
                {item.icon}
                {showBadge && <NotifBadge count={badgeCount} dot />}
              </span>
              {item.label}
            </button>
          );
        })}
        {extraNav.length > 0 && (
          <button
            className={`glow-bottom-item${extraActive ? " on" : ""}`}
            onClick={() => setMoreOpen(true)}
            data-tour-nav="more"
          >
            <span className="glow-bottom-ic"><Menu className="h-5 w-5" /></span>
            Más
          </button>
        )}
      </nav>

      {/* More bottom sheet */}
      {moreOpen && (
        <div className="glow-more-wrap" onClick={() => setMoreOpen(false)}>
          <div className="glow-more" onClick={(e) => e.stopPropagation()}>
            <div className="glow-more-grip" />
            <h4 className="glow-more-title">Más secciones</h4>
            <div className="glow-more-grid">
              {extraNav.map((item) => (
                <button
                  key={item.value}
                  className={`glow-more-item${activeSection === item.value ? " on" : ""}`}
                  onClick={() => { handleTabClick(item.value); setMoreOpen(false); }}
                >
                  <span className="glow-more-ic">{item.icon}</span>
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
