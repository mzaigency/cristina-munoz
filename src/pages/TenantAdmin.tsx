import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  LogOut, 
  Loader2, 
  Home, 
  Calendar, 
  Star, 
  MessageCircle, 
  BarChart3, 
  Wallet, 
  ExternalLink, 
  Settings, 
  Scissors, 
  Users, 
  Clock, 
  ImageIcon, 
  Package,
  ChevronDown
} from "lucide-react";
import { LocalCalendarCRM } from "@/components/admin/LocalCalendarCRM";
import { ReviewsManager } from "@/components/admin/ReviewsManager";
import { SecurityMonitor } from "@/components/admin/SecurityMonitor";
import { MessagesManager } from "@/components/admin/MessagesManager";
import { CashRegisterManager } from "@/components/admin/CashRegisterManager";
import { TenantSettings } from "@/components/admin/TenantSettings";
import { ServicesManager } from "@/components/admin/ServicesManager";
import { StylistsManager } from "@/components/admin/StylistsManager";
import { BusinessHoursManager } from "@/components/admin/BusinessHoursManager";
import { StoriesAnalytics } from "@/components/admin/StoriesAnalytics";
import { ProductsManager } from "@/components/admin/ProductsManager";
import { HelpTutorial } from "@/components/admin/HelpTutorial";
import { InteractiveTour } from "@/components/admin/InteractiveTour";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

type TabValue = "calendar" | "cash" | "reviews" | "messages" | "stories" | "security" | "products" | "services" | "stylists" | "hours" | "subscription" | "settings";

interface NavItem {
  value: TabValue;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  group: "main" | "config";
}

export default function TenantAdmin() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [activeTab, setActiveTab] = useState<TabValue>("calendar");
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);
  const [messagesUnreadCount, setMessagesUnreadCount] = useState(0);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const navItems: NavItem[] = [
    { value: "calendar", label: "Agenda", icon: <Calendar className="h-4 w-4" />, group: "main" },
    { value: "cash", label: "Caja", icon: <Wallet className="h-4 w-4" />, group: "main" },
    { value: "reviews", label: "Reseñas", icon: <Star className="h-4 w-4" />, badge: pendingReviewsCount, group: "main" },
    { value: "messages", label: "Mensajes", icon: <MessageCircle className="h-4 w-4" />, badge: messagesUnreadCount, group: "main" },
    { value: "stories", label: "Stories", icon: <ImageIcon className="h-4 w-4" />, group: "main" },
    { value: "security", label: "Stats", icon: <BarChart3 className="h-4 w-4" />, group: "main" },
    { value: "products", label: "Productos", icon: <Package className="h-4 w-4" />, group: "main" },
    { value: "services", label: "Servicios", icon: <Scissors className="h-4 w-4" />, group: "main" },
    { value: "stylists", label: "Equipo", icon: <Users className="h-4 w-4" />, group: "main" },
    { value: "hours", label: "Horarios", icon: <Clock className="h-4 w-4" />, group: "main" },
    { value: "settings", label: "Ajustes", icon: <Settings className="h-4 w-4" />, group: "main" },
  ];

  const mainItems = navItems.filter(item => item.group === "main");
  const configItems = navItems.filter(item => item.group === "config");

  useEffect(() => {
    checkAuth();
  }, [slug]);

  useEffect(() => {
    if (tenant?.id) {
      fetchPendingReviews();
      fetchMessagesUnreadCount();
      fetchStylists();

      const reviewsChannel = supabase
        .channel("pending-reviews-count")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "reviews",
            filter: `tenant_id=eq.${tenant.id}`
          },
          () => fetchPendingReviews()
        )
        .subscribe();

      const messagesChannel = supabase
        .channel("messages-unread-count")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "conversations",
            filter: `tenant_id=eq.${tenant.id}`
          },
          () => fetchMessagesUnreadCount()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(reviewsChannel);
        supabase.removeChannel(messagesChannel);
      };
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
      setStylists(data.map(s => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        color: s.color || "#8B5CF6"
      })));
    }
  };

  const fetchPendingReviews = async () => {
    if (!tenant?.id) return;
    
    try {
      const { count } = await supabase
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenant.id)
        .eq("approved", false);

      setPendingReviewsCount(count || 0);
    } catch (error) {
      console.error("Error fetching pending reviews:", error);
    }
  };

  const fetchMessagesUnreadCount = async () => {
    if (!tenant?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("unread_count_salon")
        .eq("tenant_id", tenant.id);

      if (error) throw error;

      const totalUnread = data?.reduce((sum, conv) => sum + (conv.unread_count_salon || 0), 0) || 0;
      setMessagesUnreadCount(totalUnread);
    } catch (error) {
      console.error("Error fetching messages unread count:", error);
    }
  };

  const checkAuth = async () => {
    if (!slug) {
      navigate("/");
      return;
    }

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
        variant: "destructive"
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
      variant: "destructive"
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
    // Trigger a refresh by updating the key
    setRefreshKey(prev => prev + 1);
    // Also refresh counts
    if (tenant?.id) {
      await Promise.all([
        fetchPendingReviews(),
        fetchMessagesUnreadCount(),
        fetchStylists()
      ]);
    }
    toast({
      title: "Actualizado",
      description: "Datos actualizados correctamente",
    });
  }, [tenant?.id]);

  const renderContent = () => {
    if (!tenant) return null;
    
    switch (activeTab) {
      case "calendar":
        return <LocalCalendarCRM key={refreshKey} tenantId={tenant.id} stylists={stylists} />;
      case "cash":
        return <CashRegisterManager key={refreshKey} tenantId={tenant.id} />;
      case "reviews":
        return <ReviewsManager key={refreshKey} tenantId={tenant.id} />;
      case "messages":
        return <MessagesManager key={refreshKey} tenantId={tenant.id} />;
      case "stories":
        return <StoriesAnalytics key={refreshKey} tenantId={tenant.id} />;
      case "security":
        return <SecurityMonitor key={refreshKey} tenantId={tenant.id} />;
      case "products":
        return <ProductsManager key={refreshKey} tenantId={tenant.id} />;
      case "services":
        return <ServicesManager key={refreshKey} tenantId={tenant.id} />;
      case "stylists":
        return <StylistsManager key={refreshKey} tenantId={tenant.id} />;
      case "hours":
        return <BusinessHoursManager key={refreshKey} tenantId={tenant.id} />;
      case "subscription":
        return (
          <div className="text-center py-12 text-muted-foreground">
            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Gestión de suscripción próximamente</p>
          </div>
        );
      case "settings":
        return <TenantSettings key={refreshKey} tenantId={tenant.id} tenantSlug={tenant.slug} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess || !tenant) {
    return null;
  }

  const activeItem = navItems.find(item => item.value === activeTab);
  const isConfigTab = configItems.some(item => item.value === activeTab);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header - Mobile optimized with safe area */}
      <header className="sticky top-0 z-50 bg-background border-b shadow-sm safe-area-top">
        <div className="mx-auto max-w-7xl px-4 md:px-4">
          {/* Top row - Logo, title and actions */}
          <div className="flex items-center justify-between py-3 md:py-3 border-b border-border/50">
            <div className="flex items-center gap-3 md:gap-3 min-w-0">
              {tenant.logo_url ? (
                <img 
                  src={tenant.logo_url} 
                  alt={tenant.name} 
                  className="h-10 w-10 md:h-10 md:w-10 rounded-xl md:rounded-xl object-cover ring-2 ring-primary/20 shrink-0" 
                />
              ) : (
                <div className="h-10 w-10 md:h-10 md:w-10 rounded-xl md:rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Scissors className="h-5 w-5 md:h-5 md:w-5 text-primary" />
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-base md:text-lg font-bold text-foreground truncate">{tenant.name}</h1>
                <p className="text-xs md:text-xs text-muted-foreground truncate">{userEmail}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-2">
              <div className="hidden md:flex items-center gap-2">
                <InteractiveTour onTabChange={(tab) => setActiveTab(tab as TabValue)} />
                <HelpTutorial />
              </div>
              <Button 
                onClick={() => navigate(`/salon/${slug}`)} 
                variant="outline" 
                size="sm"
                className="gap-1.5 h-10 md:h-9 px-3 md:px-3 text-sm md:text-sm"
                aria-label="Ver página web del salón"
              >
                <ExternalLink className="h-4 w-4 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Ver web</span>
              </Button>
              <Button 
                onClick={() => navigate("/")} 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 md:h-8 md:w-8" 
                title="Inicio"
                aria-label="Ir a inicio"
              >
                <Home className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
              <Button 
                onClick={handleSignOut} 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 md:h-8 md:w-8" 
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
            </div>
          </div>

          {/* Bottom row - Navigation tabs - Scrollable on mobile */}
          <nav 
            className="flex items-center gap-1 md:gap-1 py-2 md:py-2 overflow-x-auto scrollbar-hide -mx-1 px-1"
            aria-label="Navegación del panel de administración"
            role="tablist"
          >
            {mainItems.map((item) => {
              const isActive = activeTab === item.value;
              return (
                <button
                  key={item.value}
                  onClick={() => setActiveTab(item.value)}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`${item.label}${item.badge ? `, ${item.badge} pendientes` : ''}`}
                  data-tour-step={`nav-${item.value}`}
                  className={`
                    relative flex flex-col items-center gap-1 md:gap-1 
                    px-3 md:px-3 py-2 md:py-2 
                    rounded-xl md:rounded-xl transition-all duration-200 shrink-0 
                    min-w-[56px] md:min-w-[60px]
                    min-h-[56px] md:min-h-0
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                    ${isActive 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }
                  `}
                >
                  <div className="relative">
                    {item.value === "calendar" && <Calendar className="h-5 w-5 md:h-5 md:w-5" />}
                    {item.value === "cash" && <Wallet className="h-5 w-5 md:h-5 md:w-5" />}
                    {item.value === "reviews" && <Star className="h-5 w-5 md:h-5 md:w-5" />}
                    {item.value === "messages" && <MessageCircle className="h-5 w-5 md:h-5 md:w-5" />}
                    {item.value === "stories" && <ImageIcon className="h-5 w-5 md:h-5 md:w-5" />}
                    {item.value === "security" && <BarChart3 className="h-5 w-5 md:h-5 md:w-5" />}
                    {item.value === "products" && <Package className="h-5 w-5 md:h-5 md:w-5" />}
                    {item.value === "services" && <Scissors className="h-5 w-5 md:h-5 md:w-5" />}
                    {item.value === "stylists" && <Users className="h-5 w-5 md:h-5 md:w-5" />}
                    {item.value === "hours" && <Clock className="h-5 w-5 md:h-5 md:w-5" />}
                    {item.value === "settings" && <Settings className="h-5 w-5 md:h-5 md:w-5" />}
                    {item.badge && item.badge > 0 && (
                      <span 
                        className="absolute -top-1.5 -right-1.5 flex h-4 w-4 md:h-4 md:w-4 items-center justify-center rounded-full bg-destructive text-[9px] md:text-[9px] font-bold text-white"
                        aria-hidden="true"
                      >
                        {item.badge > 9 ? "9+" : item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] md:text-[10px] font-medium leading-none">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Content with Pull to Refresh on mobile */}
      {isMobile ? (
        <PullToRefresh onRefresh={handleRefresh} className="flex-1 min-h-0">
          <main className="mx-auto max-w-7xl px-4 py-4 safe-area-bottom">
            {renderContent()}
          </main>
        </PullToRefresh>
      ) : (
        <main className="mx-auto max-w-7xl px-4 py-6 safe-area-bottom">
          {renderContent()}
        </main>
      )}
    </div>
  );
}
