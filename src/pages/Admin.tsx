import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { LogOut, Loader2, Home, Calendar, Star, MessageSquare, Shield } from "lucide-react";
import { CalendarCRM } from "@/components/admin/CalendarCRM";
import { ReviewsManager } from "@/components/admin/ReviewsManager";
import { SecurityMonitor } from "@/components/admin/SecurityMonitor";
import { WhatsAppManager } from "@/components/admin/WhatsAppManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [activeTab, setActiveTab] = useState("calendar");
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);
  const [whatsappUnreadCount, setWhatsappUnreadCount] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    fetchPendingReviews();
    fetchWhatsAppUnreadCount();

    // Subscribe to real-time updates for reviews
    const reviewsChannel = supabase
      .channel('pending-reviews-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reviews'
        },
        () => {
          fetchPendingReviews();
        }
      )
      .subscribe();

    // Subscribe to real-time updates for WhatsApp contacts
    const whatsappChannel = supabase
      .channel('whatsapp-unread-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_contacts'
        },
        () => {
          fetchWhatsAppUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(reviewsChannel);
      supabase.removeChannel(whatsappChannel);
    };
  }, []);

  const fetchPendingReviews = async () => {
    try {
      const { count } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('approved', false);
      
      setPendingReviewsCount(count || 0);
    } catch (error) {
      console.error('Error fetching pending reviews:', error);
    }
  };

  const fetchWhatsAppUnreadCount = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .select('unread_count');
      
      if (error) throw error;
      
      const totalUnread = data?.reduce((sum, contact) => sum + (contact.unread_count || 0), 0) || 0;
      setWhatsappUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error fetching WhatsApp unread count:', error);
    }
  };

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/auth");
      return;
    }

    setUserEmail(session.user.email || "");
    
    // Check if user has admin or stylist role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    if (!roles || roles.length === 0) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos de administrador o estilista",
        variant: "destructive",
      });
      await supabase.auth.signOut();
      navigate("/auth");
      return;
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    try {
      // Forzar limpieza local incluso si la sesión del servidor falla
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.error("Error during sign out:", error);
    }
    
    // Limpiar localStorage manualmente por si acaso
    try {
      localStorage.removeItem('supabase.auth.token');
    } catch (e) {
      console.error("Error clearing localStorage:", e);
    }
    
    // Siempre redirigir a auth
    navigate("/auth", { replace: true });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-salon-pink-dark" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-3 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 md:mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Panel de Administración</h1>
            <p className="text-sm md:text-base text-muted-foreground">Bienvenida, {userEmail}</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button onClick={() => navigate("/")} variant="outline" className="flex-1 md:flex-initial" size="sm">
              <Home className="mr-1 md:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Ir a Inicio</span>
              <span className="sm:hidden">Inicio</span>
            </Button>
            <Button onClick={handleSignOut} variant="outline" className="flex-1 md:flex-initial" size="sm">
              <LogOut className="mr-1 md:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Cerrar sesión</span>
              <span className="sm:hidden">Salir</span>
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="inline-flex h-12 items-center justify-center gap-1 rounded-lg bg-transparent p-0 border-b w-full max-w-none">
            <TabsTrigger 
              value="calendar" 
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none border-b-2 border-transparent px-3 md:px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden md:inline">Calendario</span>
            </TabsTrigger>
            <TabsTrigger 
              value="reviews" 
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none border-b-2 border-transparent px-3 md:px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none relative"
            >
              <Star className="h-4 w-4" />
              <span className="hidden md:inline">Reseñas</span>
              {pendingReviewsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 md:relative md:top-0 md:right-0 md:ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
                  {pendingReviewsCount > 99 ? '99+' : pendingReviewsCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="whatsapp" 
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none border-b-2 border-transparent px-3 md:px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none relative"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden md:inline">WhatsApp</span>
              {whatsappUnreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 md:relative md:top-0 md:right-0 md:ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
                  {whatsappUnreadCount > 99 ? '99+' : whatsappUnreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none border-b-2 border-transparent px-3 md:px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden md:inline">Seguridad</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="calendar" className="mt-6">
            <CalendarCRM />
          </TabsContent>
          <TabsContent value="reviews" className="mt-6">
            <ReviewsManager />
          </TabsContent>
          <TabsContent value="whatsapp" className="mt-6">
            <WhatsAppManager />
          </TabsContent>
          <TabsContent value="security" className="mt-6">
            <SecurityMonitor />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
