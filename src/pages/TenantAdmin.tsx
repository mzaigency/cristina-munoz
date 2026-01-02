import { useEffect, useState } from "react";
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
import { GuidedTour } from "@/components/admin/GuidedTour";
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
  
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();

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

  const renderContent = () => {
    if (!tenant) return null;
    
    switch (activeTab) {
      case "calendar":
        return <LocalCalendarCRM tenantId={tenant.id} stylists={stylists} />;
      case "cash":
        return <CashRegisterManager tenantId={tenant.id} />;
      case "reviews":
        return <ReviewsManager tenantId={tenant.id} />;
      case "messages":
        return <MessagesManager tenantId={tenant.id} />;
      case "stories":
        return <StoriesAnalytics tenantId={tenant.id} />;
      case "security":
        return <SecurityMonitor tenantId={tenant.id} />;
      case "products":
        return <ProductsManager tenantId={tenant.id} />;
      case "services":
        return <ServicesManager tenantId={tenant.id} />;
      case "stylists":
        return <StylistsManager tenantId={tenant.id} />;
      case "hours":
        return <BusinessHoursManager tenantId={tenant.id} />;
      case "subscription":
        return (
          <div className="text-center py-12 text-muted-foreground">
            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Gestión de suscripción próximamente</p>
          </div>
        );
      case "settings":
        return <TenantSettings tenantId={tenant.id} tenantSlug={tenant.slug} />;
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
    <div className="min-h-screen bg-background">
      {/* Header - Fully accessible mobile design */}
      <header className="sticky top-0 z-50 bg-card border-b-2 border-border safe-area-top shadow-md">
        <div className="px-4 md:px-6 lg:px-8">
          {/* Top row - Logo, title and actions */}
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Brand section */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {tenant.logo_url ? (
                <img 
                  src={tenant.logo_url} 
                  alt={`Logo de ${tenant.name}`} 
                  className="h-10 w-10 md:h-12 md:w-12 rounded-xl object-cover ring-2 ring-primary/30 shrink-0" 
                />
              ) : (
                <div 
                  className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary flex items-center justify-center shrink-0"
                  role="img"
                  aria-label={`Logo de ${tenant.name}`}
                >
                  <Scissors className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-base md:text-xl font-bold text-foreground truncate leading-tight">
                  {tenant.name}
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground truncate" aria-label="Email del usuario">
                  {userEmail}
                </p>
              </div>
            </div>

            {/* Actions - Always visible */}
            <nav className="flex items-center gap-2" aria-label="Acciones rápidas">
              <div className="hidden md:flex items-center gap-2">
                <GuidedTour onTabChange={(tab) => setActiveTab(tab as TabValue)} />
                <HelpTutorial />
              </div>
              
              <Button 
                onClick={() => navigate(`/salon/${slug}`)} 
                variant="outline" 
                size="sm"
                className="h-10 px-3 md:px-4 gap-2 font-medium border-2 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Ver página web del salón"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Ver web</span>
              </Button>
              
              <Button 
                onClick={() => navigate("/")} 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Ir a inicio"
              >
                <Home className="h-5 w-5" aria-hidden="true" />
              </Button>
              
              <Button 
                onClick={handleSignOut} 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-5 w-5" aria-hidden="true" />
              </Button>
            </nav>
          </div>
        </div>

        {/* Navigation tabs - Accessible scrollable navigation */}
        <nav 
          className="border-t border-border/50 bg-muted/30" 
          aria-label="Navegación del panel de administración"
          role="tablist"
        >
          <div className="px-4 md:px-6 lg:px-8">
            <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-hide -mx-2 px-2">
              {mainItems.map((item) => {
                const isActive = activeTab === item.value;
                return (
                  <button
                    key={item.value}
                    onClick={() => setActiveTab(item.value)}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`panel-${item.value}`}
                    tabIndex={isActive ? 0 : -1}
                    className={`
                      relative flex flex-col items-center justify-center gap-1 
                      min-w-[56px] md:min-w-[72px] h-14 md:h-16 px-2 md:px-3
                      rounded-xl transition-all duration-200 shrink-0
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                      ${isActive 
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }
                    `}
                  >
                    <div className="relative flex items-center justify-center">
                      {item.value === "calendar" && <Calendar className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />}
                      {item.value === "cash" && <Wallet className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />}
                      {item.value === "reviews" && <Star className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />}
                      {item.value === "messages" && <MessageCircle className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />}
                      {item.value === "stories" && <ImageIcon className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />}
                      {item.value === "security" && <BarChart3 className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />}
                      {item.value === "products" && <Package className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />}
                      {item.value === "services" && <Scissors className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />}
                      {item.value === "stylists" && <Users className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />}
                      {item.value === "hours" && <Clock className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />}
                      {item.value === "settings" && <Settings className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />}
                      
                      {/* Badge for notifications */}
                      {item.badge && item.badge > 0 && (
                        <span 
                          className="absolute -top-1 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground ring-2 ring-background"
                          aria-label={`${item.badge} ${item.badge === 1 ? 'pendiente' : 'pendientes'}`}
                        >
                          {item.badge > 99 ? "99+" : item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] md:text-xs font-semibold leading-none whitespace-nowrap">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content Area */}
      <main 
        className="px-4 md:px-6 lg:px-8 py-4 md:py-6 safe-area-bottom"
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={activeTab}
      >
        <div className="mx-auto max-w-7xl">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
