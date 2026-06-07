import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    redirectToTenantAdmin();
  }, []);

  const redirectToTenantAdmin = async () => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!session) {
        navigate("/auth");
        return;
      }

      const userId = session.user.id;

      // Check if superadmin
      const { data: superadminRole, error: superadminError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "superadmin")
        .maybeSingle();

      if (superadminError) throw superadminError;

      if (superadminRole) {
        navigate("/superadmin", { replace: true });
        return;
      }

      // Check if tenant admin and get tenant slug
      const { data: adminData, error: adminError } = await supabase
        .from("tenant_admins")
        .select("tenant_id, tenants(slug)")
        .eq("user_id", userId)
        .maybeSingle();

      if (adminError) throw adminError;

      if (adminData && adminData.tenants) {
        const tenantSlug = (adminData.tenants as any).slug;
        navigate(`/admin/${tenantSlug}`, { replace: true });
        return;
      }

      // Check if stylist and get tenant slug
      const { data: stylistData, error: stylistError } = await supabase
        .from("tenant_stylists")
        .select("tenant_id, tenants(slug)")
        .eq("user_id", userId)
        .maybeSingle();

      if (stylistError) throw stylistError;

      if (stylistData && stylistData.tenants) {
        const tenantSlug = (stylistData.tenants as any).slug;
        navigate(`/admin/${tenantSlug}`, { replace: true });
        return;
      }

      // No admin/stylist access
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos de administrador",
        variant: "destructive",
      });
      navigate("/");
    } catch (error) {
      console.error("Error loading admin tenant:", error);
      toast({
        title: "No se pudo cargar tu salón",
        description: "Hay un problema de conexión. Recarga la página e inténtalo de nuevo.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
