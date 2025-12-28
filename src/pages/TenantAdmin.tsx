import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Loader2, Home, Calendar, Star, MessageCircle, BarChart3, Wallet, ExternalLink, Settings, Scissors, Users, Clock, ImageIcon } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export default function TenantAdmin() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [activeTab, setActiveTab] = useState("calendar");
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);
  const [messagesUnreadCount, setMessagesUnreadCount] = useState(0);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [hasAccess, setHasAccess] = useState(false);
  
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();

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

    // Get tenant by slug
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

    // Check if user has access to this tenant
    const userId = session.user.id;

    // Check if superadmin
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

    // Check if tenant admin
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

    // Check if tenant stylist
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

    // No access
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

  return (
    <div className="min-h-screen bg-muted/30 p-3 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 md:mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              {tenant.logo_url && (
                <img src={tenant.logo_url} alt={tenant.name} className="h-10 w-10 rounded-full object-cover" />
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">{tenant.name}</h1>
                <p className="text-sm md:text-base text-muted-foreground">Panel de Administración</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Bienvenida, {userEmail}</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button 
              onClick={() => navigate(`/salon/${slug}`)} 
              variant="outline" 
              className="flex-1 md:flex-initial" 
              size="sm"
            >
              <ExternalLink className="mr-1 md:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Ver Landing</span>
              <span className="sm:hidden">Ver</span>
            </Button>
            <Button onClick={() => navigate("/")} variant="outline" className="flex-1 md:flex-initial" size="sm">
              <Home className="mr-1 md:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Inicio</span>
            </Button>
            <Button onClick={handleSignOut} variant="outline" className="flex-1 md:flex-initial" size="sm">
              <LogOut className="mr-1 md:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="inline-flex h-12 items-center justify-center gap-1 rounded-lg bg-transparent p-0 border-b w-full max-w-none overflow-x-auto">
            <TabsTrigger
              value="calendar"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none border-b-2 border-transparent px-3 md:px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden md:inline">Calendario</span>
            </TabsTrigger>
            <TabsTrigger
              value="cash"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none border-b-2 border-transparent px-3 md:px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <Wallet className="h-4 w-4" />
              <span className="hidden md:inline">Caja</span>
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none border-b-2 border-transparent px-3 md:px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none relative"
            >
              <Star className="h-4 w-4" />
              <span className="hidden md:inline">Reseñas</span>
              {pendingReviewsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 md:relative md:top-0 md:right-0 md:ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
                  {pendingReviewsCount > 99 ? "99+" : pendingReviewsCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="messages"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none border-b-2 border-transparent px-3 md:px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none relative"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden md:inline">Mensajes</span>
              {messagesUnreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 md:relative md:top-0 md:right-0 md:ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
                  {messagesUnreadCount > 99 ? "99+" : messagesUnreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="stories"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none border-b-2 border-transparent px-3 md:px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <ImageIcon className="h-4 w-4" />
              <span className="hidden md:inline">Stories</span>
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none border-b-2 border-transparent px-3 md:px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden md:inline">Estadísticas</span>
            </TabsTrigger>
            <TabsTrigger
              value="services"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none border-b-2 border-transparent px-3 md:px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <Scissors className="h-4 w-4" />
              <span className="hidden md:inline">Servicios</span>
            </TabsTrigger>
            <TabsTrigger
              value="stylists"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none border-b-2 border-transparent px-3 md:px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <Users className="h-4 w-4" />
              <span className="hidden md:inline">Estilistas</span>
            </TabsTrigger>
            <TabsTrigger
              value="hours"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none border-b-2 border-transparent px-3 md:px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <Clock className="h-4 w-4" />
              <span className="hidden md:inline">Horarios</span>
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none border-b-2 border-transparent px-3 md:px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden md:inline">Ajustes</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="calendar" className="mt-6">
            <LocalCalendarCRM tenantId={tenant.id} stylists={stylists} />
          </TabsContent>
          <TabsContent value="cash" className="mt-6">
            <CashRegisterManager tenantId={tenant.id} />
          </TabsContent>
          <TabsContent value="reviews" className="mt-6">
            <ReviewsManager tenantId={tenant.id} />
          </TabsContent>
          <TabsContent value="messages" className="mt-6">
            <MessagesManager tenantId={tenant.id} />
          </TabsContent>
          <TabsContent value="stories" className="mt-6">
            <StoriesAnalytics tenantId={tenant.id} />
          </TabsContent>
          <TabsContent value="security" className="mt-6">
            <SecurityMonitor tenantId={tenant.id} />
          </TabsContent>
          <TabsContent value="services" className="mt-6">
            <ServicesManager tenantId={tenant.id} />
          </TabsContent>
          <TabsContent value="stylists" className="mt-6">
            <StylistsManager tenantId={tenant.id} />
          </TabsContent>
          <TabsContent value="hours" className="mt-6">
            <BusinessHoursManager tenantId={tenant.id} />
          </TabsContent>
          <TabsContent value="settings" className="mt-6">
            <TenantSettings tenantId={tenant.id} tenantSlug={tenant.slug} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
