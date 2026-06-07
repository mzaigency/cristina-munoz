import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Home,
  ExternalLink,
  Scissors,
  Menu,
  ShoppingBag,
  Megaphone,
  UserCircle,
  Briefcase,
  Plus,
  Search,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";
import { AdminHelpMenu } from "@/components/admin/layout/AdminHelpMenu";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { useTenantAccess } from "@/hooks/useTenantAccess";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { SubscriptionExpiredScreen } from "@/components/admin/SubscriptionExpiredScreen";
import { NotifBadge } from "@/components/admin/layout/NotifBadge";
import { AdminAccountMenu } from "@/components/admin/layout/AdminAccountMenu";
import { AdminCommandPalette } from "@/components/admin/layout/AdminCommandPalette";
import { AdminSubNav, getDefaultSubTab, ADMIN_SUB_NAV, type AdminSection } from "@/components/admin/layout/AdminSubNav";
import { useUnseenOrders } from "@/hooks/useUnseenOrders";
import { motion, AnimatePresence } from "framer-motion";

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
  whatsapp: { section: "marketing", subTab: "posts" },
  team: { section: "negocio", subTab: "equipo" },
  stylists: { section: "negocio", subTab: "equipo" },
  hours: { section: "negocio", subTab: "equipo" },
  reports: { section: "negocio", subTab: "informes" },
  stats: { section: "negocio", subTab: "informes" },
  goals: { section: "negocio", subTab: "informes" },
  settings: { section: "negocio", subTab: "ajustes" },
};

// Primary sections shown directly in mobile bottom nav (4 + "Más")
const PRIMARY_SECTIONS: SectionValue[] = ["inicio", "clientes", "catalogo", "marketing"];

export default function TenantAdmin() {
  const [userEmail, setUserEmail] = useState("");
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

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

  const loading = tenantLoading || accessLoading;

  if (loading || subscriptionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--gp-bg)" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--gp-accent)" }} />
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

  // Derive topbar breadcrumb labels
  const sectionLabel = navItems.find((n) => n.value === activeSection)?.label ?? "";
  const subTabLabel =
    ADMIN_SUB_NAV[activeSection as AdminSection]?.find((s) => s.value === activeSubTab)?.label ?? sectionLabel;

  // Split nav into primary (bottom bar) and secondary ("Más")
  const primaryNavItems = navItems.filter((n) => PRIMARY_SECTIONS.includes(n.value));
  const restNavItems = navItems.filter((n) => !PRIMARY_SECTIONS.includes(n.value));
  const restIsActive = restNavItems.some((n) => n.value === activeSection);

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

  return (
    <div className="min-h-screen" style={{ background: "var(--gp-bg)" }}>
      <AdminCommandPalette
        tenantSlug={slug || ""}
        onNavigate={(path) => navigate(path)}
        onNewBooking={() => goToSection("inicio", "agenda")}
        onViewWeb={() => navigate(`/${slug}`)}
        onSignOut={handleSignOut}
      />

      {/* ── Mobile sheet sidebar ────────────────────────────────── */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[280px] p-0 flex flex-col [&>button]:hidden"
                      style={{ background: "var(--gp-card)", borderColor: "var(--gp-line)" }}>
          <div className="flex items-center gap-[11px] px-[18px] pt-[18px] pb-[14px] border-b"
               style={{ borderColor: "var(--gp-line)", paddingTop: "calc(env(safe-area-inset-top) + 18px)" }}>
            {tenant.logo_url ? (
              <img src={tenant.logo_url} alt={tenant.name} className="w-[38px] h-[38px] rounded-[12px] object-cover flex-none" />
            ) : (
              <div className="w-[38px] h-[38px] rounded-[12px] flex-none flex items-center justify-center text-white font-black text-[19px]"
                   style={{ background: "linear-gradient(150deg, var(--gp-accent), #7b2ff7)", boxShadow: "0 6px 16px -6px rgba(67,97,238,.65)" }}>
                {tenant.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col min-w-0 leading-[1.1]">
              <span className="font-black text-[16px] tracking-[-0.02em] truncate" style={{ color: "var(--gp-ink)" }}>{tenant.name}</span>
              <span className="text-[11.5px] font-semibold truncate capitalize" style={{ color: "var(--gp-muted-color)" }}>
                {subscriptionPlan ? `Plan ${subscriptionPlan}` : "GlowApp"}
              </span>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-1.5 flex flex-col gap-0.5">
            {navItems.map((item) => {
              const isActive = activeSection === item.value;
              const badgeCount = typeof item.badge === "number" ? item.badge : 0;
              const showBadge = badgeCount > 0 && !isActive;
              return (
                <button
                  key={item.value}
                  onClick={() => handleTabClick(item.value)}
                  className={cn("gp-navitem", isActive && "gp-on")}
                >
                  <span className="gp-navitem-ic">{item.icon}</span>
                  <span className="flex-1 text-left">{item.label}</span>
                  {showBadge && (
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full text-white text-[11px] font-black flex items-center justify-center"
                          style={{ background: "var(--gp-accent)" }}>
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="border-t px-3 py-4 space-y-1" style={{ borderColor: "var(--gp-line)", paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}>
            <button
              onClick={() => { setSidebarOpen(false); navigate(`/${slug}`); }}
              className="gp-navitem"
            >
              <span className="gp-navitem-ic"><ExternalLink className="h-4 w-4" /></span>
              Ver web
            </button>
            <button
              onClick={() => { setSidebarOpen(false); handleSignOut(); }}
              className="gp-navitem"
              style={{ color: "var(--gp-danger)" }}
            >
              <span className="gp-navitem-ic" style={{ color: "var(--gp-danger)" }}><Scissors className="h-4 w-4" /></span>
              Cerrar sesión
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── "Más" bottom sheet (mobile) ─────────────────────────── */}
      {moreMenuOpen && (
        <div className="gp-more-wrap" onClick={() => setMoreMenuOpen(false)}>
          <div className="gp-more" onClick={(e) => e.stopPropagation()}>
            <div className="gp-more-grip" />
            <p className="gp-more-title">Más secciones</p>
            <div className="gp-more-grid">
              {restNavItems.map((item) => (
                <button
                  key={item.value}
                  className={cn("gp-more-item", activeSection === item.value && "gp-on")}
                  onClick={() => { handleTabClick(item.value); setMoreMenuOpen(false); }}
                >
                  <span className="gp-more-ic">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── App shell ───────────────────────────────────────────── */}
      <div className="flex min-h-screen">

        {/* ── Desktop sidebar ──────────────────────────── */}
        <aside
          className="hidden min-[920px]:flex w-[252px] flex-none sticky top-0 h-screen flex-col z-30 border-r"
          style={{ background: "var(--gp-card)", borderColor: "var(--gp-line)" }}
        >
          {/* Brand */}
          <div className="flex items-center gap-[11px] px-[18px] pt-[18px] pb-[14px]">
            {tenant.logo_url ? (
              <img src={tenant.logo_url} alt={tenant.name} className="w-[38px] h-[38px] rounded-[12px] object-cover flex-none" />
            ) : (
              <div className="w-[38px] h-[38px] rounded-[12px] flex-none flex items-center justify-center text-white font-black text-[19px]"
                   style={{ background: "linear-gradient(150deg, var(--gp-accent), #7b2ff7)", boxShadow: "0 6px 16px -6px rgba(67,97,238,.65)" }}>
                {tenant.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col min-w-0 leading-[1.1]">
              <span className="font-black text-[16px] tracking-[-0.02em] truncate" style={{ color: "var(--gp-ink)" }}>{tenant.name}</span>
              <span className="text-[11.5px] font-semibold truncate" style={{ color: "var(--gp-muted-color)" }}>
                {subscriptionPlan ? `Plan ${subscriptionPlan}` : "GlowApp"}
              </span>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-1.5 flex flex-col gap-0.5">
            {navItems.map((item) => {
              const isActive = activeSection === item.value;
              const badgeCount = typeof item.badge === "number" ? item.badge : 0;
              const showBadge = badgeCount > 0 && !isActive;
              const subItems = ADMIN_SUB_NAV[item.value as AdminSection] || [];
              const hasSubItems = subItems.length > 1;

              return (
                <div key={item.value}>
                  <button
                    onClick={() => handleTabClick(item.value)}
                    data-tour-step={`nav-${item.value}`}
                    aria-selected={isActive}
                    className={cn("gp-navitem", isActive && "gp-on")}
                  >
                    <span className="gp-navitem-ic">{item.icon}</span>
                    <span className="flex-1 text-left">{item.label}</span>
                    {showBadge && (
                      <span className="min-w-[20px] h-5 px-1.5 rounded-full text-white text-[11px] font-black flex items-center justify-center"
                            style={{ background: "var(--gp-accent)" }}>
                        {badgeCount}
                      </span>
                    )}
                    {hasSubItems && (
                      <ChevronDown
                        className="h-4 w-4 flex-none transition-transform duration-200"
                        style={{
                          color: "var(--gp-muted-color)",
                          transform: isActive ? "rotate(0deg)" : "rotate(-90deg)",
                        }}
                      />
                    )}
                  </button>

                  {/* Sub-nav */}
                  {isActive && hasSubItems && (
                    <div className="ml-4 pl-3 border-l flex flex-col gap-px mt-0.5 mb-1 gp-fade"
                         style={{ borderColor: "var(--gp-line)" }}>
                      {subItems.map((sub) => {
                        const isSubActive = activeSubTab === sub.value;
                        const subBadge = sub.badgeKey ? subNavCounts[sub.badgeKey as keyof typeof subNavCounts] || 0 : 0;
                        return (
                          <button
                            key={sub.value}
                            onClick={() => goToSection(activeSection, sub.value)}
                            className={cn("gp-subitem", isSubActive && "gp-on")}
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

          {/* Footer */}
          <div className="p-3 border-t" style={{ borderColor: "var(--gp-line)" }}>
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
        </aside>

        {/* ── Main area ────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col">

          {/* ── Topbar ──────────────────────────── */}
          <header
            className="flex-none sticky top-0 z-20 flex items-center gap-3.5 border-b"
            style={{
              height: "var(--gp-topbar-h)",
              padding: "0 26px",
              background: "color-mix(in oklab, var(--gp-bg), white 30%)",
              backdropFilter: "blur(12px)",
              borderColor: "var(--gp-line)",
              paddingTop: "env(safe-area-inset-top)",
            }}
          >
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="min-[920px]:hidden flex items-center justify-center rounded-[11px] border transition-all flex-none"
              style={{ width: 40, height: 40, background: "var(--gp-card)", borderColor: "var(--gp-line)", color: "var(--gp-ink2)" }}
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb + title */}
            <div className="flex flex-col leading-[1.1]">
              <span className="text-[11.5px] font-bold tracking-[0.02em] uppercase" style={{ color: "var(--gp-muted-color)" }}>
                {sectionLabel}
              </span>
              <span className="text-[19px] font-black tracking-[-0.02em]" style={{ color: "var(--gp-ink)" }}>
                {subTabLabel}
              </span>
            </div>

            <div className="flex-1" />

            {/* Search — desktop only */}
            <div
              className="hidden min-[920px]:flex items-center gap-[9px] rounded-[11px] px-[13px] py-[9px] w-[280px] border transition-all"
              style={{ background: "var(--gp-card)", borderColor: "var(--gp-line)" }}
              onFocusCapture={(e) => {
                e.currentTarget.style.borderColor = "var(--gp-accent)";
                e.currentTarget.style.boxShadow = "0 0 0 4px var(--gp-accent-softer)";
              }}
              onBlurCapture={(e) => {
                e.currentTarget.style.borderColor = "var(--gp-line)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <Search className="h-4 w-4 flex-none" style={{ color: "var(--gp-muted-color)" }} />
              <input
                className="border-none bg-transparent outline-none w-full text-[13.5px] font-medium"
                style={{ color: "var(--gp-ink)" }}
                placeholder="Buscar clientes, citas, productos…"
              />
            </div>

            {/* Help */}
            <AdminHelpMenu onTourTabChange={handleNavigate} />

            {/* Account menu — mobile topbar / desktop is in sidebar footer */}
            <div className="min-[920px]:hidden">
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

            {/* Nueva cita */}
            <button
              onClick={() => goToSection("inicio", "agenda")}
              className="flex items-center gap-2 rounded-[11px] px-4 py-2.5 text-[13.5px] font-bold text-white transition-all hover:brightness-110 hover:-translate-y-px active:translate-y-0"
              style={{
                marginLeft: 2,
                background: "linear-gradient(150deg, var(--gp-accent), color-mix(in oklab, var(--gp-accent), #000 15%))",
                boxShadow: "0 8px 18px -8px color-mix(in oklab, var(--gp-accent), transparent 35%)",
              }}
            >
              <Plus className="h-4 w-4 flex-none" />
              <span className="hidden sm:inline">Nueva cita</span>
            </button>
          </header>

          {/* ── SubNav ──────────────────────────── */}
          <AdminSubNav
            tenantId={tenant.id}
            section={activeSection as AdminSection}
            activeSubTab={activeSubTab}
            counts={subNavCounts}
            onSelect={(t) => goToSection(activeSection, t)}
          />

          {/* ── Content ─────────────────────────── */}
          {isMobile ? (
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
            <main
              className="flex-1 mx-auto max-w-[1280px] w-full"
              style={{ padding: "26px" }}
            >
              {animatedContent}
            </main>
          )}

          {/* ── Mobile bottom nav ───────────────── */}
          <nav
            className="min-[920px]:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-around border-t"
            style={{
              background: "var(--gp-card)",
              borderColor: "var(--gp-line)",
              padding: "8px 6px",
              paddingBottom: "calc(8px + env(safe-area-inset-bottom))",
              boxShadow: "0 -8px 24px -16px rgba(20,22,40,.25)",
            }}
          >
            {primaryNavItems.map((item) => {
              const isActive = activeSection === item.value;
              const badgeCount = typeof item.badge === "number" ? item.badge : 0;
              const showBadge = badgeCount > 0 && !isActive;
              return (
                <button
                  key={item.value}
                  onClick={() => handleTabClick(item.value)}
                  className={cn("gp-bottom-item", isActive && "gp-on")}
                  aria-label={item.label}
                  data-tour-step={`nav-${item.value}`}
                >
                  <span className="gp-bottom-ic relative">
                    {item.icon}
                    {showBadge && <NotifBadge count={badgeCount} dot />}
                  </span>
                  {item.label}
                </button>
              );
            })}
            {/* "Más" button */}
            {restNavItems.length > 0 && (
              <button
                onClick={() => setMoreMenuOpen(true)}
                className={cn("gp-bottom-item", restIsActive && "gp-on")}
                aria-label="Más secciones"
              >
                <span className="gp-bottom-ic">
                  <MoreHorizontal className="h-5 w-5" />
                </span>
                Más
              </button>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}
