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
  CreditCard, 
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
    { value: "security", label: "Estadísticas", icon: <BarChart3 className="h-4 w-4" />, group: "main" },
    { value: "products", label: "Productos", icon: <Package className="h-4 w-4" />, group: "config" },
    { value: "services", label: "Servicios", icon: <Scissors className="h-4 w-4" />, group: "config" },
    { value: "stylists", label: "Equipo", icon: <Users className="h-4 w-4" />, group: "config" },
    { value: "hours", label: "Horarios", icon: <Clock className="h-4 w-4" />, group: "config" },
    { value: "subscription", label: "Suscripción", icon: <CreditCard className="h-4 w-4" />, group: "config" },
    { value: "settings", label: "Ajustes", icon: <Settings className="h-4 w-4" />, group: "config" },
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
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
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
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo and Name */}
            <div className="flex items-center gap-3">
              {tenant.logo_url && (
                <img src={tenant.logo_url} alt={tenant.name} className="h-8 w-8 rounded-full object-cover" />
              )}
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-foreground leading-tight">{tenant.name}</h1>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
              {mainItems.map((item) => (
                <Button
                  key={item.value}
                  variant={activeTab === item.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab(item.value)}
                  className="relative gap-1.5 shrink-0"
                >
                  {item.icon}
                  <span className="hidden md:inline">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </Button>
              ))}
              
              {/* Config Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant={isConfigTab ? "default" : "ghost"} 
                    size="sm" 
                    className="gap-1.5 shrink-0"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="hidden md:inline">Configuración</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {configItems.map((item, index) => (
                    <div key={item.value}>
                      {index === 4 && <DropdownMenuSeparator />}
                      <DropdownMenuItem 
                        onClick={() => setActiveTab(item.value)}
                        className={activeTab === item.value ? "bg-accent" : ""}
                      >
                        {item.icon}
                        <span className="ml-2">{item.label}</span>
                      </DropdownMenuItem>
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button 
                onClick={() => navigate(`/salon/${slug}`)} 
                variant="ghost" 
                size="icon"
                title="Ver landing"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button onClick={() => navigate("/")} variant="ghost" size="icon" title="Inicio">
                <Home className="h-4 w-4" />
              </Button>
              <Button onClick={handleSignOut} variant="ghost" size="icon" title="Cerrar sesión">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            {activeItem?.icon}
            {activeItem?.label}
          </h2>
        </div>
        {renderContent()}
      </main>
    </div>
  );
}
