import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { LogOut, Calendar, Clock, User, Phone, Loader2, Home } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarCRM } from "@/components/admin/CalendarCRM";

type DbBooking = Database["public"]["Tables"]["bookings"]["Row"];

export default function Admin() {
  const [bookings, setBookings] = useState<DbBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

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

    loadBookings();
  };

  const loadBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("status", "confirmed")
        .gte("Fecha", new Date().toISOString().split("T")[0])
        .order("Fecha", { ascending: true })
        .order("Hora", { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar las reservas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const getStylistName = (stylist: string) => {
    if (stylist === "cris") return "Cris";
    if (stylist === "desi") return "Desi";
    return "Cualquier peluquera";
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

        <Tabs defaultValue="calendar" className="space-y-4 md:space-y-6">
          <TabsList className="w-full grid grid-cols-2 md:w-auto md:inline-flex">
            <TabsTrigger value="calendar" className="text-xs md:text-sm">
              <span className="hidden sm:inline">📅 CRM - Calendario</span>
              <span className="sm:hidden">📅 Calendario</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="text-xs md:text-sm">
              <span className="hidden sm:inline">📋 Reservas ({bookings.length})</span>
              <span className="sm:hidden">📋 ({bookings.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
            <CalendarCRM />
          </TabsContent>

          <TabsContent value="bookings">
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-lg md:text-xl">Próximas Reservas ({bookings.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                {bookings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay reservas pendientes
                  </p>
                ) : (
                  <div className="space-y-3 md:space-y-4">
                    {bookings.map((booking) => (
                      <Card key={booking.id} className="border">
                        <CardContent className="p-4 md:pt-6">
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-2">
                              <div className="flex items-start gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <span className="font-medium">
                                  {format(new Date(booking.Fecha), "EEEE, d 'de' MMMM 'de' yyyy", {
                                    locale: es,
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span>{booking.Hora}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span>{getStylistName(booking.stylist)}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="text-sm">
                                <span className="font-medium">Cliente:</span> {booking.customer_name}
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="break-all">{booking.Telefono}</span>
                              </div>
                              <div className="text-sm">
                                <span className="font-medium">Servicios:</span>{" "}
                                <span className="break-words">
                                  {Array.isArray(booking.services)
                                    ? (booking.services as Array<{ name: string }>)
                                        .map((s) => s.name)
                                        .join(", ")
                                    : "N/A"}
                                </span>
                              </div>
                              <div className="text-sm">
                                <span className="font-medium">Duración:</span> {booking.total_duration} min
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
