import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { LogOut, Loader2, Home } from "lucide-react";
import { CalendarCRM } from "@/components/admin/CalendarCRM";
import { ReviewsManager } from "@/components/admin/ReviewsManager";
import { AuditLogsViewer } from "@/components/admin/AuditLogsViewer";
import { SecurityMonitor } from "@/components/admin/SecurityMonitor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [activeTab, setActiveTab] = useState("calendar");
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    fetchPendingReviews();

    // Subscribe to real-time updates for reviews
    const channel = supabase
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

    return () => {
      supabase.removeChannel(channel);
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
          <TabsList className="grid w-full max-w-3xl grid-cols-3 h-auto md:h-10">
            <TabsTrigger value="calendar" className="py-3 md:py-2 text-sm md:text-sm">Calendario</TabsTrigger>
            <TabsTrigger value="reviews" className="py-3 md:py-2 text-sm md:text-sm relative">
              Reseñas
              {pendingReviewsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {pendingReviewsCount > 99 ? '99+' : pendingReviewsCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="security" className="py-3 md:py-2 text-sm md:text-sm">Seguridad</TabsTrigger>
          </TabsList>
          <TabsContent value="calendar" className="mt-6">
            <CalendarCRM />
          </TabsContent>
          <TabsContent value="reviews" className="mt-6">
            <ReviewsManager />
          </TabsContent>
          <TabsContent value="security" className="mt-6 space-y-6">
            <SecurityMonitor />
            <AuditLogsViewer />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
